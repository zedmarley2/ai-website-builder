#!/usr/bin/env tsx
/**
 * Pars Tabela - Bağımsız Güncelleme Yöneticisi
 * Port 4000'de çalışır, ana uygulamadan (3000) tamamen bağımsızdır.
 * Ana uygulama yeniden başlatılırken bile ayakta kalır.
 */

import express, { Request, Response, NextFunction } from 'express';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import http from 'http';

const execAsync = promisify(exec);

// ─── Configuration ───────────────────────────────────────────────────────────
const PORT = parseInt(process.env.UPDATE_PORT || '4000', 10);
const PROJECT_DIR = process.env.PROJECT_DIR || '/home/developer/projects/ai-website-builder';
const BACKUP_DIR = process.env.BACKUP_DIR || '/home/developer/backups';
const ADMIN_PASSWORD = process.env.UPDATE_ADMIN_PASSWORD || 'pars2024!';
const MAIN_APP_PORT = parseInt(process.env.MAIN_APP_PORT || '3000', 10);
const PM2_APP_NAME = process.env.PM2_APP_NAME || 'pars-tabela';
const GIT_BRANCH = process.env.GIT_BRANCH || 'main';
const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pars_tabela';
const HEALTH_TIMEOUT = 30000;

// ─── State ───────────────────────────────────────────────────────────────────
const activeSessions = new Map<string, { createdAt: number }>();
let updateInProgress = false;
const updateHistory: Array<{
  date: string;
  success: boolean;
  fromHash: string;
  toHash: string;
  message: string;
}> = [];

const HISTORY_FILE = path.join(BACKUP_DIR, 'update-history.json');
function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
      updateHistory.push(...data);
    }
  } catch { /* ignore */ }
}
function saveHistory() {
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(updateHistory, null, 2));
  } catch { /* ignore */ }
}
loadHistory();

// ─── Helpers ─────────────────────────────────────────────────────────────────
function generateToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

function parseCookies(req: Request): Record<string, string> {
  const cookies: Record<string, string> = {};
  const header = req.headers.cookie;
  if (!header) return cookies;
  header.split(';').forEach(c => {
    const [key, ...val] = c.trim().split('=');
    if (key) cookies[key] = val.join('=');
  });
  return cookies;
}

function isAuthenticated(req: Request): boolean {
  const cookies = parseCookies(req);
  const token = cookies['update_session'];
  if (!token) return false;
  const session = activeSessions.get(token);
  if (!session) return false;
  if (Date.now() - session.createdAt > 24 * 60 * 60 * 1000) {
    activeSessions.delete(token);
    return false;
  }
  return true;
}

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/api/login' || req.path === '/login') {
    return next();
  }
  if (!isAuthenticated(req)) {
    if (req.path.startsWith('/api/')) {
      res.status(401).json({ error: 'Yetkisiz erişim' });
      return;
    }
    res.redirect('/login');
    return;
  }
  next();
}

async function runCommand(cmd: string, cwd?: string, timeoutMs = 120000): Promise<{ stdout: string; stderr: string }> {
  return execAsync(cmd, {
    cwd: cwd || PROJECT_DIR,
    timeout: timeoutMs,
    maxBuffer: 10 * 1024 * 1024,
    env: { ...process.env, PATH: process.env.PATH },
  });
}

async function getGitInfo() {
  try {
    const [hash, branch, remote, msg, date] = await Promise.all([
      runCommand('git rev-parse HEAD').then(r => r.stdout.trim()),
      runCommand('git rev-parse --abbrev-ref HEAD').then(r => r.stdout.trim()),
      runCommand('git remote get-url origin').then(r => r.stdout.trim()).catch(() => 'N/A'),
      runCommand('git log -1 --format=%s').then(r => r.stdout.trim()),
      runCommand('git log -1 --format=%ci').then(r => r.stdout.trim()),
    ]);
    return {
      currentHash: hash,
      currentHashShort: hash.substring(0, 7),
      branch,
      remoteUrl: remote,
      lastCommitMessage: msg,
      lastCommitDate: date,
    };
  } catch {
    return {
      currentHash: 'unknown', currentHashShort: 'unknown', branch: 'unknown',
      remoteUrl: 'unknown', lastCommitMessage: 'unknown', lastCommitDate: 'unknown',
    };
  }
}

async function checkForUpdates() {
  await runCommand(`git fetch origin ${GIT_BRANCH}`, PROJECT_DIR, 30000);
  const localHash = (await runCommand('git rev-parse HEAD')).stdout.trim();
  const remoteHash = (await runCommand(`git rev-parse origin/${GIT_BRANCH}`)).stdout.trim();

  if (localHash === remoteHash) {
    return { updateAvailable: false, behindCount: 0, commits: [], localHash, remoteHash };
  }

  const logOutput = (await runCommand(
    `git log ${localHash}..${remoteHash} --format="%H|||%s|||%ci" --max-count=20`
  )).stdout.trim();

  const commits = logOutput.split('\n').filter(Boolean).map(line => {
    const [hash, message, date] = line.split('|||');
    return { hash: hash.substring(0, 7), message, date };
  });

  return { updateAvailable: true, behindCount: commits.length, commits, localHash, remoteHash };
}

async function isAppRunning(): Promise<boolean> {
  return new Promise(resolve => {
    const req = http.get(`http://localhost:${MAIN_APP_PORT}/`, { timeout: 3000 }, (res) => {
      resolve(res.statusCode !== undefined);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function isPm2Available(): Promise<boolean> {
  try {
    await runCommand('pm2 jlist', undefined, 5000);
    return true;
  } catch {
    return false;
  }
}

async function getPackageVersion(): Promise<string> {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_DIR, 'package.json'), 'utf-8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function parseDbUrl(url: string) {
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) return null;
  return { user: match[1], password: match[2], host: match[3], port: match[4], database: match[5] };
}

async function getBackupList() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) return [];
    const entries = fs.readdirSync(BACKUP_DIR);
    const backups: Array<{ name: string; date: string; type: 'db' | 'app'; size: string; path: string }> = [];

    for (const entry of entries) {
      const fullPath = path.join(BACKUP_DIR, entry);
      const stat = fs.statSync(fullPath);

      if (entry.startsWith('db-') && entry.endsWith('.sql')) {
        backups.push({
          name: entry, date: entry.replace('db-', '').replace('.sql', ''),
          type: 'db', size: formatBytes(stat.size), path: fullPath,
        });
      } else if (entry.startsWith('app-') && stat.isDirectory()) {
        const dirSize = await getDirSize(fullPath);
        backups.push({
          name: entry, date: entry.replace('app-', ''),
          type: 'app', size: formatBytes(dirSize), path: fullPath,
        });
      }
    }
    return backups.sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}

async function getDirSize(dir: string): Promise<number> {
  try {
    const { stdout } = await runCommand(`du -sb "${dir}" | cut -f1`, undefined, 10000);
    return parseInt(stdout.trim(), 10) || 0;
  } catch {
    return 0;
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function healthCheck(): Promise<boolean> {
  return new Promise(resolve => {
    const startTime = Date.now();
    const check = () => {
      if (Date.now() - startTime > HEALTH_TIMEOUT) { resolve(false); return; }
      const req = http.get(`http://localhost:${MAIN_APP_PORT}/api/health`, { timeout: 5000 }, (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => setTimeout(check, 2000));
      req.on('timeout', () => { req.destroy(); setTimeout(check, 2000); });
    };
    setTimeout(check, 3000);
  });
}

// ─── SSE Helper ──────────────────────────────────────────────────────────────
type SSEWriter = {
  sendStep: (step: number, message: string, status: 'running' | 'done' | 'error') => void;
  sendLog: (message: string) => void;
  sendComplete: (success: boolean, message: string) => void;
};

function createSSE(res: Response): SSEWriter {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  return {
    sendStep(step, message, status) {
      res.write(`data: ${JSON.stringify({ type: 'step', step, message, status })}\n\n`);
    },
    sendLog(message) {
      res.write(`data: ${JSON.stringify({ type: 'log', message })}\n\n`);
    },
    sendComplete(success, message) {
      res.write(`data: ${JSON.stringify({ type: 'complete', success, message })}\n\n`);
      res.end();
    },
  };
}

// ─── Update Pipeline ─────────────────────────────────────────────────────────
async function performUpdate(sse: SSEWriter) {
  if (updateInProgress) {
    sse.sendComplete(false, 'Bir güncelleme zaten devam ediyor.');
    return;
  }

  updateInProgress = true;
  let previousHash = '';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dbBackupPath = path.join(BACKUP_DIR, `db-${timestamp}.sql`);
  const appBackupPath = path.join(BACKUP_DIR, `app-${timestamp}`);
  let backupCreated = false;

  try {
    const gitInfo = await getGitInfo();
    previousHash = gitInfo.currentHash;
    const usePm2 = await isPm2Available();

    // ─── Step 1: Backup ─────────────────────────────────────────────
    sse.sendStep(1, 'Yedekleme başlatılıyor...', 'running');
    fs.mkdirSync(BACKUP_DIR, { recursive: true });

    sse.sendLog('Veritabanı yedekleniyor...');
    const dbInfo = parseDbUrl(DB_URL);
    if (dbInfo) {
      try {
        await runCommand(
          `PGPASSWORD="${dbInfo.password}" pg_dump -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d ${dbInfo.database} -f "${dbBackupPath}"`,
          undefined, 120000
        );
        sse.sendLog(`✓ Veritabanı yedeği: ${dbBackupPath}`);
      } catch (e: any) {
        sse.sendLog(`⚠ Veritabanı yedeği alınamadı: ${e.message}`);
      }
    }

    sse.sendLog('Uygulama dosyaları yedekleniyor...');
    await runCommand(
      `rsync -a --exclude='node_modules' --exclude='.next' --exclude='.git' "${PROJECT_DIR}/" "${appBackupPath}/"`,
      undefined, 120000
    );
    sse.sendLog(`✓ Dosya yedeği: ${appBackupPath}`);
    backupCreated = true;
    sse.sendStep(1, 'Yedekleme tamamlandı', 'done');

    // ─── Step 2: Stop main app ──────────────────────────────────────
    sse.sendStep(2, 'Ana uygulama durduruluyor...', 'running');
    if (usePm2) {
      try {
        await runCommand(`pm2 stop ${PM2_APP_NAME}`, undefined, 15000);
        sse.sendLog(`✓ pm2 stop ${PM2_APP_NAME}`);
      } catch {
        sse.sendLog('⚠ PM2 ile durdurulamadı, port kontrolü yapılıyor...');
        try { await runCommand(`fuser -k ${MAIN_APP_PORT}/tcp`, undefined, 5000); sse.sendLog(`✓ Port ${MAIN_APP_PORT} serbest bırakıldı`); }
        catch { sse.sendLog('ℹ Uygulama zaten durdurulmuş olabilir'); }
      }
    } else {
      try { await runCommand(`fuser -k ${MAIN_APP_PORT}/tcp`, undefined, 5000); sse.sendLog(`✓ Port ${MAIN_APP_PORT} serbest bırakıldı`); }
      catch { sse.sendLog('ℹ Uygulama zaten durdurulmuş olabilir'); }
    }
    sse.sendStep(2, 'Ana uygulama durduruldu', 'done');

    // ─── Step 3: Pull updates ───────────────────────────────────────
    sse.sendStep(3, 'Güncellemeler indiriliyor...', 'running');
    await runCommand(`git fetch origin ${GIT_BRANCH}`, PROJECT_DIR, 30000);
    sse.sendLog('✓ git fetch tamamlandı');
    const resetResult = await runCommand(`git reset --hard origin/${GIT_BRANCH}`, PROJECT_DIR, 30000);
    sse.sendLog(`✓ ${resetResult.stdout.trim()}`);
    sse.sendStep(3, 'Güncellemeler indirildi', 'done');

    // ─── Step 4: Install dependencies ───────────────────────────────
    sse.sendStep(4, 'Bağımlılıklar kuruluyor...', 'running');
    const npmResult = await runCommand('npm install --production=false', PROJECT_DIR, 300000);
    const addedMatch = npmResult.stderr.match(/added (\d+) packages/);
    sse.sendLog(`✓ npm install tamamlandı${addedMatch ? ` (${addedMatch[1]} paket)` : ''}`);
    sse.sendStep(4, 'Bağımlılıklar kuruldu', 'done');

    // ─── Step 5: Prisma ─────────────────────────────────────────────
    sse.sendStep(5, 'Prisma güncelleniyor...', 'running');
    await runCommand('npx prisma generate', PROJECT_DIR, 60000);
    sse.sendLog('✓ Prisma client oluşturuldu');
    try {
      await runCommand('npx prisma migrate deploy', PROJECT_DIR, 60000);
      sse.sendLog('✓ Veritabanı migrasyonları uygulandı');
    } catch (e: any) {
      sse.sendLog(`⚠ Migrasyon uyarısı: ${e.message.substring(0, 200)}`);
    }
    sse.sendStep(5, 'Prisma güncellendi', 'done');

    // ─── Step 6: Build ──────────────────────────────────────────────
    sse.sendStep(6, 'Proje derleniyor...', 'running');
    sse.sendLog('Bu adım birkaç dakika sürebilir...');
    await runCommand('npm run build', PROJECT_DIR, 600000);
    sse.sendLog('✓ Build tamamlandı');
    sse.sendStep(6, 'Proje derlendi', 'done');

    // ─── Step 7: Start app ──────────────────────────────────────────
    sse.sendStep(7, 'Ana uygulama başlatılıyor...', 'running');
    if (usePm2) {
      try {
        await runCommand(`pm2 start ${PM2_APP_NAME}`, undefined, 15000);
        sse.sendLog(`✓ pm2 start ${PM2_APP_NAME}`);
      } catch {
        await runCommand(
          `cd "${PROJECT_DIR}" && PORT=${MAIN_APP_PORT} pm2 start npm --name ${PM2_APP_NAME} -- start`,
          undefined, 15000
        );
        sse.sendLog('✓ PM2 ile yeni süreç başlatıldı');
      }
    } else {
      const child = spawn('npm', ['start'], {
        cwd: PROJECT_DIR,
        env: { ...process.env, PORT: String(MAIN_APP_PORT), NODE_ENV: 'production' },
        detached: true, stdio: 'ignore',
      });
      child.unref();
      sse.sendLog(`✓ Uygulama başlatıldı (PID: ${child.pid})`);
    }
    sse.sendStep(7, 'Ana uygulama başlatıldı', 'done');

    // ─── Step 8: Health check ───────────────────────────────────────
    sse.sendStep(8, 'Sağlık kontrolü...', 'running');
    sse.sendLog('Uygulama yanıt vermesi bekleniyor...');
    const healthy = await healthCheck();
    if (healthy) {
      sse.sendLog('✓ Uygulama sağlıklı çalışıyor');
      sse.sendStep(8, 'Sağlık kontrolü başarılı', 'done');
      const newGitInfo = await getGitInfo();
      updateHistory.push({
        date: new Date().toISOString(), success: true,
        fromHash: previousHash.substring(0, 7), toHash: newGitInfo.currentHashShort,
        message: `Güncelleme başarılı: ${newGitInfo.lastCommitMessage}`,
      });
      saveHistory();
      sse.sendComplete(true, 'Güncelleme başarıyla tamamlandı!');
    } else {
      throw new Error('Sağlık kontrolü başarısız - uygulama yanıt vermiyor');
    }
  } catch (error: any) {
    const errorMsg = error.message || 'Bilinmeyen hata';
    sse.sendLog(`✗ HATA: ${errorMsg}`);

    // ─── Rollback ───────────────────────────────────────────────────
    if (backupCreated) {
      sse.sendStep(8, 'Geri alma işlemi başlatılıyor...', 'error');
      sse.sendLog('Önceki sürüme geri dönülüyor...');
      try {
        const usePm2 = await isPm2Available();
        if (usePm2) { try { await runCommand(`pm2 stop ${PM2_APP_NAME}`, undefined, 10000); } catch { /* ok */ } }
        try { await runCommand(`fuser -k ${MAIN_APP_PORT}/tcp`, undefined, 5000); } catch { /* ok */ }

        sse.sendLog('Dosyalar geri yükleniyor...');
        await runCommand(
          `rsync -a --delete --exclude='node_modules' --exclude='.next' --exclude='.git' "${appBackupPath}/" "${PROJECT_DIR}/"`,
          undefined, 120000
        );
        sse.sendLog('✓ Dosyalar geri yüklendi');

        const dbInfo = parseDbUrl(DB_URL);
        if (dbInfo && fs.existsSync(dbBackupPath)) {
          sse.sendLog('Veritabanı geri yükleniyor...');
          try {
            await runCommand(
              `PGPASSWORD="${dbInfo.password}" psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d ${dbInfo.database} -f "${dbBackupPath}"`,
              undefined, 120000
            );
            sse.sendLog('✓ Veritabanı geri yüklendi');
          } catch (dbErr: any) {
            sse.sendLog(`⚠ Veritabanı geri yüklenemedi: ${dbErr.message}`);
          }
        }

        sse.sendLog('Eski sürüm derleniyor...');
        await runCommand('npm install --production=false', PROJECT_DIR, 300000);
        await runCommand('npx prisma generate', PROJECT_DIR, 60000);
        await runCommand('npm run build', PROJECT_DIR, 600000);

        if (usePm2) {
          try { await runCommand(`pm2 start ${PM2_APP_NAME}`, undefined, 15000); } catch {
            await runCommand(`cd "${PROJECT_DIR}" && PORT=${MAIN_APP_PORT} pm2 start npm --name ${PM2_APP_NAME} -- start`, undefined, 15000);
          }
        } else {
          const child = spawn('npm', ['start'], {
            cwd: PROJECT_DIR, env: { ...process.env, PORT: String(MAIN_APP_PORT), NODE_ENV: 'production' },
            detached: true, stdio: 'ignore',
          });
          child.unref();
        }
        sse.sendLog('✓ Eski sürüm geri yüklendi ve başlatıldı');
      } catch (rollbackErr: any) {
        sse.sendLog(`✗ Geri alma sırasında hata: ${rollbackErr.message}`);
      }
    }

    updateHistory.push({
      date: new Date().toISOString(), success: false,
      fromHash: previousHash.substring(0, 7), toHash: 'failed',
      message: `Güncelleme başarısız: ${errorMsg.substring(0, 200)}`,
    });
    saveHistory();
    sse.sendComplete(false, `Güncelleme başarısız, önceki sürüme geri dönüldü. Hata: ${errorMsg}`);
  } finally {
    updateInProgress = false;
  }
}

// ─── Restore from specific backup ────────────────────────────────────────────
async function restoreBackup(backupDate: string, sse: SSEWriter) {
  if (updateInProgress) { sse.sendComplete(false, 'Bir işlem zaten devam ediyor.'); return; }

  updateInProgress = true;
  const dbBackupPath = path.join(BACKUP_DIR, `db-${backupDate}.sql`);
  const appBackupPath = path.join(BACKUP_DIR, `app-${backupDate}`);

  try {
    const usePm2 = await isPm2Available();

    sse.sendStep(1, 'Yedek kontrol ediliyor...', 'running');
    if (!fs.existsSync(appBackupPath)) throw new Error(`Uygulama yedeği bulunamadı: ${appBackupPath}`);
    sse.sendLog(`✓ Yedek bulundu: ${backupDate}`);
    sse.sendStep(1, 'Yedek doğrulandı', 'done');

    sse.sendStep(2, 'Ana uygulama durduruluyor...', 'running');
    if (usePm2) { try { await runCommand(`pm2 stop ${PM2_APP_NAME}`, undefined, 15000); } catch { /* ok */ } }
    try { await runCommand(`fuser -k ${MAIN_APP_PORT}/tcp`, undefined, 5000); } catch { /* ok */ }
    sse.sendStep(2, 'Ana uygulama durduruldu', 'done');

    sse.sendStep(3, 'Dosyalar geri yükleniyor...', 'running');
    await runCommand(
      `rsync -a --delete --exclude='node_modules' --exclude='.next' --exclude='.git' "${appBackupPath}/" "${PROJECT_DIR}/"`,
      undefined, 120000
    );
    sse.sendLog('✓ Dosyalar geri yüklendi');
    sse.sendStep(3, 'Dosyalar geri yüklendi', 'done');

    if (fs.existsSync(dbBackupPath)) {
      sse.sendStep(4, 'Veritabanı geri yükleniyor...', 'running');
      const dbInfo = parseDbUrl(DB_URL);
      if (dbInfo) {
        await runCommand(
          `PGPASSWORD="${dbInfo.password}" psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d ${dbInfo.database} -f "${dbBackupPath}"`,
          undefined, 120000
        );
        sse.sendLog('✓ Veritabanı geri yüklendi');
      }
      sse.sendStep(4, 'Veritabanı geri yüklendi', 'done');
    } else {
      sse.sendStep(4, 'Veritabanı yedeği yok, atlanıyor', 'done');
    }

    sse.sendStep(5, 'Bağımlılıklar kuruluyor...', 'running');
    await runCommand('npm install --production=false', PROJECT_DIR, 300000);
    await runCommand('npx prisma generate', PROJECT_DIR, 60000);
    sse.sendStep(5, 'Bağımlılıklar kuruldu', 'done');

    sse.sendStep(6, 'Proje derleniyor...', 'running');
    await runCommand('npm run build', PROJECT_DIR, 600000);
    sse.sendStep(6, 'Proje derlendi', 'done');

    sse.sendStep(7, 'Ana uygulama başlatılıyor...', 'running');
    if (usePm2) {
      try { await runCommand(`pm2 start ${PM2_APP_NAME}`, undefined, 15000); } catch {
        await runCommand(`cd "${PROJECT_DIR}" && PORT=${MAIN_APP_PORT} pm2 start npm --name ${PM2_APP_NAME} -- start`, undefined, 15000);
      }
    } else {
      const child = spawn('npm', ['start'], {
        cwd: PROJECT_DIR, env: { ...process.env, PORT: String(MAIN_APP_PORT), NODE_ENV: 'production' },
        detached: true, stdio: 'ignore',
      });
      child.unref();
    }
    sse.sendStep(7, 'Ana uygulama başlatıldı', 'done');

    sse.sendStep(8, 'Sağlık kontrolü...', 'running');
    const healthy = await healthCheck();
    if (healthy) {
      sse.sendStep(8, 'Sağlık kontrolü başarılı', 'done');
      sse.sendComplete(true, `Yedek başarıyla geri yüklendi: ${backupDate}`);
    } else {
      sse.sendStep(8, 'Uygulama yanıt vermiyor', 'error');
      sse.sendComplete(false, 'Geri yükleme sonrası uygulama yanıt vermiyor');
    }
  } catch (error: any) {
    sse.sendComplete(false, `Geri yükleme başarısız: ${error.message}`);
  } finally {
    updateInProgress = false;
  }
}

// ─── Express App ─────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Login ───────────────────────────────────────────────────────────────────
app.get('/login', (_req, res) => { res.send(getLoginHTML()); });

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = generateToken();
    activeSessions.set(token, { createdAt: Date.now() });
    res.setHeader('Set-Cookie', `update_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`);
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Yanlış şifre' });
  }
});

app.post('/api/logout', (req, res) => {
  const cookies = parseCookies(req);
  const token = cookies['update_session'];
  if (token) activeSessions.delete(token);
  res.setHeader('Set-Cookie', 'update_session=; Path=/; HttpOnly; Max-Age=0');
  res.json({ success: true });
});

app.use(authMiddleware);

// ─── API Routes ──────────────────────────────────────────────────────────────
app.get('/api/status', async (_req, res) => {
  try {
    const [gitInfo, appRunning, version, backups] = await Promise.all([
      getGitInfo(), isAppRunning(), getPackageVersion(), getBackupList(),
    ]);
    res.json({
      app: { running: appRunning, port: MAIN_APP_PORT, version },
      git: gitInfo,
      backups,
      history: updateHistory.slice(-20).reverse(),
      updateInProgress,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/check-updates', async (_req, res) => {
  try {
    const result = await checkForUpdates();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/update', (req, res) => {
  const sse = createSSE(res);
  performUpdate(sse);
});

app.get('/api/restore/:date', (req, res) => {
  const sse = createSSE(res);
  restoreBackup(req.params.date, sse);
});

app.delete('/api/backup/:name', async (req, res) => {
  try {
    const name = req.params.name;
    const fullPath = path.join(BACKUP_DIR, name);
    if (!fullPath.startsWith(BACKUP_DIR)) { res.status(400).json({ error: 'Geçersiz yol' }); return; }

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) fs.rmSync(fullPath, { recursive: true });
    else fs.unlinkSync(fullPath);

    // Delete corresponding pair
    if (name.startsWith('db-')) {
      const appDir = path.join(BACKUP_DIR, name.replace('db-', 'app-').replace('.sql', ''));
      if (fs.existsSync(appDir)) fs.rmSync(appDir, { recursive: true });
    } else if (name.startsWith('app-')) {
      const dbFile = path.join(BACKUP_DIR, name.replace('app-', 'db-') + '.sql');
      if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Dashboard ───────────────────────────────────────────────────────────────
app.get('/', (_req, res) => { res.send(getDashboardHTML()); });

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🔧 Pars Tabela Güncelleme Yöneticisi`);
  console.log(`   Port: ${PORT}`);
  console.log(`   Proje: ${PROJECT_DIR}`);
  console.log(`   Ana uygulama: localhost:${MAIN_APP_PORT}`);
  console.log(`   Dashboard: http://localhost:${PORT}\n`);
});

// ─── HTML Templates ──────────────────────────────────────────────────────────

function getLoginHTML(): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Güncelleme Yöneticisi - Giriş</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0f172a; --surface: #1e293b; --border: #334155;
      --text: #f1f5f9; --text-muted: #94a3b8; --primary: #3b82f6;
      --primary-hover: #2563eb; --error: #ef4444;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg); color: var(--text);
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
    }
    .login-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 16px; padding: 40px; width: 100%; max-width: 400px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
    }
    .login-card h1 { font-size: 24px; margin-bottom: 8px; text-align: center; }
    .login-card p { color: var(--text-muted); text-align: center; margin-bottom: 32px; font-size: 14px; }
    .logo { text-align: center; margin-bottom: 24px; font-size: 40px; }
    label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 8px; color: var(--text-muted); }
    input[type="password"] {
      width: 100%; padding: 12px 16px; background: var(--bg); border: 1px solid var(--border);
      border-radius: 8px; color: var(--text); font-size: 16px; outline: none; transition: border-color 0.2s;
    }
    input:focus { border-color: var(--primary); }
    button {
      width: 100%; padding: 12px; background: var(--primary); color: white;
      border: none; border-radius: 8px; font-size: 16px; font-weight: 600;
      cursor: pointer; margin-top: 24px; transition: background 0.2s;
    }
    button:hover { background: var(--primary-hover); }
    .error { color: var(--error); font-size: 14px; margin-top: 12px; text-align: center; display: none; }
  </style>
</head>
<body>
  <div class="login-card">
    <div class="logo">&#128295;</div>
    <h1>Guncelleme Yoneticisi</h1>
    <p>Pars Tabela sistem yonetimi</p>
    <form id="loginForm">
      <label for="password">Yonetici Sifresi</label>
      <input type="password" id="password" placeholder="Sifrenizi girin" autofocus required>
      <div class="error" id="error">Yanlis sifre</div>
      <button type="submit">Giris Yap</button>
    </form>
  </div>
  <script>
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = document.getElementById('password').value;
      const errorEl = document.getElementById('error');
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });
        if (res.ok) { window.location.href = '/'; }
        else { errorEl.style.display = 'block'; errorEl.textContent = 'Yanlis sifre'; }
      } catch { errorEl.style.display = 'block'; errorEl.textContent = 'Baglanti hatasi'; }
    });
  </script>
</body>
</html>`;
}

function getDashboardHTML(): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Guncelleme Yoneticisi - Pars Tabela</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0f172a; --bg-alt: #0c1322; --surface: #1e293b; --surface-hover: #263348;
      --border: #334155; --border-light: #475569;
      --text: #f1f5f9; --text-muted: #94a3b8; --text-dim: #64748b;
      --primary: #3b82f6; --primary-hover: #2563eb; --primary-bg: rgba(59,130,246,0.1);
      --success: #22c55e; --success-bg: rgba(34,197,94,0.1);
      --warning: #f59e0b; --warning-bg: rgba(245,158,11,0.1);
      --error: #ef4444; --error-bg: rgba(239,68,68,0.1);
      --radius: 12px;
    }
    :root.light {
      --bg: #f8fafc; --bg-alt: #f1f5f9; --surface: #ffffff; --surface-hover: #f8fafc;
      --border: #e2e8f0; --border-light: #cbd5e1;
      --text: #0f172a; --text-muted: #475569; --text-dim: #94a3b8;
      --primary-bg: rgba(59,130,246,0.08); --success-bg: rgba(34,197,94,0.08);
      --warning-bg: rgba(245,158,11,0.08); --error-bg: rgba(239,68,68,0.08);
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg); color: var(--text); min-height: 100vh; padding: 24px; line-height: 1.5;
    }
    .container { max-width: 960px; margin: 0 auto; }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .header-left h1 { font-size: 24px; font-weight: 700; }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-running { background: var(--success-bg); color: var(--success); }
    .badge-stopped { background: var(--error-bg); color: var(--error); }
    .theme-toggle {
      background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
      padding: 8px 12px; cursor: pointer; color: var(--text); font-size: 18px; transition: all 0.2s;
    }
    .theme-toggle:hover { background: var(--surface-hover); border-color: var(--border-light); }
    .btn {
      padding: 10px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px;
    }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: var(--primary); color: white; }
    .btn-primary:hover:not(:disabled) { background: var(--primary-hover); }
    .btn-danger { background: var(--error); color: white; }
    .btn-danger:hover:not(:disabled) { background: #dc2626; }
    .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text); }
    .btn-outline:hover:not(:disabled) { background: var(--surface-hover); border-color: var(--border-light); }
    .btn-sm { padding: 6px 12px; font-size: 12px; }
    .btn-logout { background: transparent; border: 1px solid var(--border); color: var(--text-muted); }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; margin-bottom: 20px; }
    .card-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .info-item label { display: block; font-size: 12px; color: var(--text-dim); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-item value { display: block; font-size: 14px; font-weight: 500; word-break: break-all; }
    .info-item code { background: var(--bg-alt); padding: 2px 8px; border-radius: 4px; font-family: 'SF Mono', Monaco, monospace; font-size: 13px; }
    .steps { margin: 20px 0; }
    .step { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); font-size: 14px; }
    .step:last-child { border-bottom: none; }
    .step-icon { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; font-weight: 600; }
    .step-pending .step-icon { background: var(--bg-alt); color: var(--text-dim); border: 2px solid var(--border); }
    .step-running .step-icon { background: var(--primary-bg); color: var(--primary); border: 2px solid var(--primary); animation: pulse 1.5s infinite; }
    .step-done .step-icon { background: var(--success-bg); color: var(--success); }
    .step-error .step-icon { background: var(--error-bg); color: var(--error); }
    .step-text { flex: 1; }
    .step-pending .step-text { color: var(--text-dim); }
    .step-running .step-text { color: var(--primary); font-weight: 500; }
    .step-done .step-text { color: var(--success); }
    .step-error .step-text { color: var(--error); }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .log-area {
      background: var(--bg-alt); border: 1px solid var(--border); border-radius: 8px;
      padding: 16px; max-height: 300px; overflow-y: auto;
      font-family: 'SF Mono', Monaco, monospace; font-size: 13px; line-height: 1.6;
      white-space: pre-wrap; color: var(--text-muted);
    }
    .log-area .log-success { color: var(--success); }
    .log-area .log-error { color: var(--error); }
    .log-area .log-warning { color: var(--warning); }
    .update-info { background: var(--primary-bg); border: 1px solid rgba(59,130,246,0.2); border-radius: 8px; padding: 16px; margin: 16px 0; }
    .update-info .count { font-size: 20px; font-weight: 700; color: var(--primary); }
    .commit-list { margin-top: 12px; max-height: 200px; overflow-y: auto; }
    .commit { display: flex; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--border); font-size: 13px; }
    .commit:last-child { border-bottom: none; }
    .commit-hash { color: var(--primary); font-family: monospace; flex-shrink: 0; }
    .commit-msg { color: var(--text-muted); flex: 1; }
    .backup-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 8px; transition: background 0.2s;
    }
    .backup-item:hover { background: var(--surface-hover); }
    .backup-info { display: flex; align-items: center; gap: 12px; }
    .backup-meta { font-size: 12px; color: var(--text-dim); }
    .backup-actions { display: flex; gap: 8px; }
    .history-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 13px; }
    .history-item:last-child { border-bottom: none; }
    .history-badge { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; flex-shrink: 0; }
    .history-success { background: var(--success-bg); color: var(--success); }
    .history-fail { background: var(--error-bg); color: var(--error); }
    .history-date { color: var(--text-dim); flex-shrink: 0; min-width: 140px; }
    .history-hash { font-family: monospace; color: var(--primary); flex-shrink: 0; }
    .result-banner { padding: 16px 20px; border-radius: 8px; margin: 16px 0; font-weight: 600; font-size: 15px; display: none; align-items: center; gap: 12px; }
    .result-success { display: flex; background: var(--success-bg); color: var(--success); border: 1px solid rgba(34,197,94,0.3); }
    .result-error { display: flex; background: var(--error-bg); color: var(--error); border: 1px solid rgba(239,68,68,0.3); }
    .empty { text-align: center; padding: 32px; color: var(--text-dim); font-size: 14px; }
    @media (max-width: 640px) { body { padding: 12px; } .header { flex-direction: column; align-items: flex-start; } .info-grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-left">
        <h1>&#128295; Guncelleme Yoneticisi</h1>
        <span class="badge" id="statusBadge">...</span>
      </div>
      <div class="header-right">
        <button class="theme-toggle" onclick="toggleTheme()" title="Tema degistir" id="themeBtn">&#127769;</button>
        <button class="btn btn-logout btn-sm" onclick="logout()">Cikis</button>
      </div>
    </div>

    <div class="card">
      <div class="card-title">&#128202; Sistem Bilgileri</div>
      <div class="info-grid">
        <div class="info-item"><label>Surum</label><value id="appVersion">...</value></div>
        <div class="info-item"><label>Commit</label><value><code id="commitHash">...</code></value></div>
        <div class="info-item"><label>Branch</label><value id="gitBranch">...</value></div>
        <div class="info-item"><label>Son Commit</label><value id="lastCommit">...</value></div>
        <div class="info-item"><label>Repo</label><value id="repoUrl">...</value></div>
        <div class="info-item"><label>Son Guncelleme</label><value id="lastUpdate">...</value></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">&#128640; Guncelleme</div>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <button class="btn btn-outline" onclick="checkUpdates()" id="btnCheck">&#128269; Guncellemeleri Kontrol Et</button>
        <button class="btn btn-primary" onclick="startUpdate()" id="btnUpdate" disabled>&#11014; Guncelle</button>
      </div>
      <div class="update-info" id="updateInfo" style="display: none;">
        <div><span class="count" id="behindCount">0</span> yeni commit mevcut</div>
        <div class="commit-list" id="commitList"></div>
      </div>
      <div class="steps" id="stepsContainer" style="display: none;">
        <div class="step step-pending" data-step="1"><div class="step-icon">1</div><div class="step-text">Yedekleme</div></div>
        <div class="step step-pending" data-step="2"><div class="step-icon">2</div><div class="step-text">Uygulamayi durdur</div></div>
        <div class="step step-pending" data-step="3"><div class="step-icon">3</div><div class="step-text">Guncellemeleri indir</div></div>
        <div class="step step-pending" data-step="4"><div class="step-icon">4</div><div class="step-text">Bagimliliklari kur</div></div>
        <div class="step step-pending" data-step="5"><div class="step-icon">5</div><div class="step-text">Prisma guncelle</div></div>
        <div class="step step-pending" data-step="6"><div class="step-icon">6</div><div class="step-text">Projeyi derle</div></div>
        <div class="step step-pending" data-step="7"><div class="step-icon">7</div><div class="step-text">Uygulamayi baslat</div></div>
        <div class="step step-pending" data-step="8"><div class="step-icon">8</div><div class="step-text">Saglik kontrolu</div></div>
      </div>
      <div class="log-area" id="logArea" style="display: none;"></div>
      <div class="result-banner" id="resultBanner"></div>
    </div>

    <div class="card">
      <div class="card-title">&#128190; Yedekler</div>
      <div id="backupList"><div class="empty">Yukleniyor...</div></div>
    </div>

    <div class="card">
      <div class="card-title">&#128220; Guncelleme Gecmisi</div>
      <div id="historyList"><div class="empty">Yukleniyor...</div></div>
    </div>
  </div>

  <script>
    function toggleTheme() {
      var root = document.documentElement;
      var isLight = root.classList.toggle('light');
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
      document.getElementById('themeBtn').innerHTML = isLight ? '&#9728;' : '&#127769;';
    }
    (function initTheme() {
      if (localStorage.getItem('theme') === 'light') {
        document.documentElement.classList.add('light');
        document.getElementById('themeBtn').innerHTML = '&#9728;';
      }
    })();

    var updatesAvailable = false;

    async function loadStatus() {
      try {
        var res = await fetch('/api/status');
        if (res.status === 401) { window.location.href = '/login'; return; }
        var data = await res.json();
        var badge = document.getElementById('statusBadge');
        if (data.app.running) { badge.textContent = 'Calisiyor'; badge.className = 'badge badge-running'; }
        else { badge.textContent = 'Durduruldu'; badge.className = 'badge badge-stopped'; }
        document.getElementById('appVersion').textContent = 'v' + data.app.version;
        document.getElementById('commitHash').textContent = data.git.currentHashShort;
        document.getElementById('gitBranch').textContent = data.git.branch;
        document.getElementById('lastCommit').textContent = data.git.lastCommitMessage;
        document.getElementById('repoUrl').textContent = data.git.remoteUrl;
        document.getElementById('lastUpdate').textContent = data.git.lastCommitDate;
        renderBackups(data.backups);
        renderHistory(data.history);
        if (data.updateInProgress) { document.getElementById('btnCheck').disabled = true; document.getElementById('btnUpdate').disabled = true; }
      } catch (err) { console.error('Status load failed:', err); }
    }

    async function checkUpdates() {
      var btn = document.getElementById('btnCheck');
      btn.disabled = true; btn.innerHTML = '&#9203; Kontrol ediliyor...';
      try {
        var res = await fetch('/api/check-updates');
        var data = await res.json();
        if (data.updateAvailable) {
          updatesAvailable = true;
          document.getElementById('btnUpdate').disabled = false;
          document.getElementById('updateInfo').style.display = 'block';
          document.getElementById('behindCount').textContent = data.behindCount;
          var listEl = document.getElementById('commitList');
          listEl.innerHTML = data.commits.map(function(c) {
            return '<div class="commit"><span class="commit-hash">' + c.hash + '</span><span class="commit-msg">' + escHtml(c.message) + '</span></div>';
          }).join('');
        } else {
          document.getElementById('updateInfo').style.display = 'none';
          document.getElementById('btnUpdate').disabled = true;
          showResult(true, 'Uygulama guncel! Yeni guncelleme yok.');
        }
      } catch (err) { showResult(false, 'Guncelleme kontrolu basarisiz: ' + err.message); }
      finally { btn.disabled = false; btn.innerHTML = '&#128269; Guncellemeleri Kontrol Et'; }
    }

    function startUpdate() {
      if (!confirm('Guncelleme baslatilsin mi?\\n\\nBu islem sirasinda ana uygulama gecici olarak durdurulacaktir.')) return;
      runSSE('/api/update');
    }

    function restoreBackup(date) {
      if (!confirm('Bu yedek geri yuklensin mi?\\n\\nTarih: ' + date + '\\n\\nMevcut veriler uzerine yazilacaktir!')) return;
      runSSE('/api/restore/' + date);
    }

    async function deleteBackup(name) {
      if (!confirm('Bu yedek silinsin mi?\\n\\n' + name)) return;
      try {
        var res = await fetch('/api/backup/' + encodeURIComponent(name), { method: 'DELETE' });
        if (res.ok) loadStatus(); else alert('Silme basarisiz');
      } catch (e) { alert('Silme basarisiz'); }
    }

    function runSSE(url) {
      document.getElementById('btnCheck').disabled = true;
      document.getElementById('btnUpdate').disabled = true;
      document.getElementById('stepsContainer').style.display = 'block';
      document.getElementById('logArea').style.display = 'block';
      document.getElementById('logArea').innerHTML = '';
      document.getElementById('resultBanner').style.display = 'none';
      document.getElementById('resultBanner').className = 'result-banner';
      var steps = document.querySelectorAll('.step');
      for (var i = 0; i < steps.length; i++) {
        steps[i].className = 'step step-pending';
        steps[i].querySelector('.step-icon').textContent = steps[i].getAttribute('data-step');
      }
      var evtSource = new EventSource(url);
      evtSource.onmessage = function(event) {
        var data = JSON.parse(event.data);
        if (data.type === 'step') { updateStep(data.step, data.message, data.status); }
        else if (data.type === 'log') { appendLog(data.message); }
        else if (data.type === 'complete') {
          evtSource.close();
          showResult(data.success, data.message);
          document.getElementById('btnCheck').disabled = false;
          setTimeout(loadStatus, 2000);
        }
      };
      evtSource.onerror = function() {
        evtSource.close();
        showResult(false, 'Baglanti kesildi');
        document.getElementById('btnCheck').disabled = false;
      };
    }

    function updateStep(stepNum, message, status) {
      var stepEl = document.querySelector('.step[data-step="' + stepNum + '"]');
      if (!stepEl) return;
      stepEl.className = 'step step-' + status;
      stepEl.querySelector('.step-text').textContent = message;
      var icon = stepEl.querySelector('.step-icon');
      if (status === 'done') icon.innerHTML = '&#10003;';
      else if (status === 'error') icon.innerHTML = '&#10007;';
      else if (status === 'running') icon.innerHTML = '&#9678;';
    }

    function appendLog(message) {
      var logEl = document.getElementById('logArea');
      var cls = '';
      if (message.indexOf('\\u2713') === 0 || message.indexOf('\\u2714') === 0) cls = 'log-success';
      else if (message.indexOf('\\u2717') === 0 || message.indexOf('HATA') >= 0) cls = 'log-error';
      else if (message.indexOf('\\u26A0') === 0) cls = 'log-warning';
      if (cls) logEl.innerHTML += '<span class="' + cls + '">' + escHtml(message) + '</span>\\n';
      else logEl.innerHTML += escHtml(message) + '\\n';
      logEl.scrollTop = logEl.scrollHeight;
    }

    function showResult(success, message) {
      var banner = document.getElementById('resultBanner');
      banner.className = 'result-banner ' + (success ? 'result-success' : 'result-error');
      banner.style.display = 'flex';
      banner.innerHTML = (success ? '&#10003; ' : '&#10007; ') + escHtml(message);
    }

    function renderBackups(backups) {
      var el = document.getElementById('backupList');
      if (!backups || backups.length === 0) { el.innerHTML = '<div class="empty">Henuz yedek yok</div>'; return; }
      var grouped = {};
      backups.forEach(function(b) { if (!grouped[b.date]) grouped[b.date] = []; grouped[b.date].push(b); });
      var html = '';
      Object.keys(grouped).sort().reverse().forEach(function(date) {
        var items = grouped[date];
        var sizes = items.map(function(i) { return i.type + ': ' + i.size; }).join(' | ');
        var displayDate = formatDate(date);
        html += '<div class="backup-item">' +
          '<div class="backup-info"><div style="font-size:20px">&#128190;</div>' +
          '<div><div style="font-size:14px;font-weight:500">' + displayDate + '</div>' +
          '<div class="backup-meta">' + sizes + '</div></div></div>' +
          '<div class="backup-actions">' +
          '<button class="btn btn-outline btn-sm" onclick="restoreBackup(\\'' + date + '\\')">&#8617; Geri Yukle</button>' +
          '<button class="btn btn-danger btn-sm" onclick="deleteBackup(\\'' + items[0].name + '\\')">&#128465;</button>' +
          '</div></div>';
      });
      el.innerHTML = html;
    }

    function renderHistory(history) {
      var el = document.getElementById('historyList');
      if (!history || history.length === 0) { el.innerHTML = '<div class="empty">Henuz guncelleme yapilmamis</div>'; return; }
      el.innerHTML = history.map(function(h) {
        return '<div class="history-item">' +
          '<span class="history-badge ' + (h.success ? 'history-success' : 'history-fail') + '">' + (h.success ? 'Basarili' : 'Basarisiz') + '</span>' +
          '<span class="history-date">' + formatDate(h.date) + '</span>' +
          '<span class="history-hash">' + h.fromHash + ' &#8594; ' + h.toHash + '</span>' +
          '<span style="flex:1;color:var(--text-muted);font-size:13px">' + escHtml(h.message) + '</span></div>';
      }).join('');
    }

    function formatDate(isoStr) {
      try {
        var clean = isoStr.replace(/-/g, function(m, i) { return i > 9 ? ':' : m; });
        var d = new Date(clean);
        if (isNaN(d.getTime())) return isoStr;
        return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      } catch (e) { return isoStr; }
    }

    function escHtml(str) { var d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

    async function logout() { await fetch('/api/logout', { method: 'POST' }); window.location.href = '/login'; }

    loadStatus();
    setInterval(loadStatus, 30000);
  </script>
</body>
</html>`;
}
