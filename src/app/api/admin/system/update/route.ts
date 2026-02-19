import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { execSync } from 'child_process';

const ROOT = process.cwd();

function run(cmd: string, timeoutMs = 120_000): string {
  return execSync(cmd, {
    cwd: ROOT,
    timeout: timeoutMs,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
}

function detectRuntime(): 'pm2' | 'dev' {
  try {
    const list = run('pm2 jlist', 5_000);
    const procs = JSON.parse(list) as { name: string; pm2_env?: { status: string } }[];
    const match = procs.find(
      (p) => p.pm2_env?.status === 'online' && ROOT.includes(p.name)
    );
    if (match) return 'pm2';
  } catch {
    // pm2 not available or not managing this app
  }

  if (process.env.NODE_ENV !== 'production') return 'dev';

  // Extra check: see if our own PID is managed by pm2
  try {
    const pid = process.pid.toString();
    const list = run('pm2 jlist', 5_000);
    const procs = JSON.parse(list) as { pid: number }[];
    if (procs.some((p) => p.pid.toString() === pid)) return 'pm2';
  } catch {
    // fall through
  }

  return 'dev';
}

/**
 * GET /api/admin/system/update
 * Check for available updates by comparing local HEAD with remote.
 */
export async function GET() {
  try {
    const { error, status } = await requireAdmin();
    if (error) return NextResponse.json({ error }, { status });

    // Fetch latest from remote
    run('git fetch origin', 15_000);

    const localHash = run('git rev-parse HEAD');
    const remoteHash = run('git rev-parse origin/main');
    const currentVersion = run('git describe --tags --always');

    let behindCount = 0;
    let commits: { hash: string; message: string; date: string }[] = [];

    if (localHash !== remoteHash) {
      behindCount = parseInt(
        run('git rev-list --count HEAD..origin/main'),
        10
      );
      const logOutput = run(
        'git log HEAD..origin/main --pretty=format:"%h|%s|%ci" --max-count=20'
      );
      if (logOutput) {
        commits = logOutput.split('\n').map((line) => {
          const [hash, message, date] = line.split('|');
          return { hash, message, date };
        });
      }
    }

    const runtime = detectRuntime();

    return NextResponse.json({
      data: {
        currentVersion,
        localHash: localHash.substring(0, 7),
        remoteHash: remoteHash.substring(0, 7),
        updateAvailable: localHash !== remoteHash,
        behindCount,
        commits,
        runtime,
      },
    });
  } catch (err) {
    console.error('Update check error:', err);
    return NextResponse.json(
      { error: 'Güncelleme kontrolü başarısız oldu' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/system/update
 * Execute the update pipeline with SSE streaming.
 * Flow: backup → git pull → npm install → prisma generate → prisma migrate → build → restart
 * Rollback on any failure.
 */
export async function POST() {
  const { error, status } = await requireAdmin();
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  const runtime = detectRuntime();
  let savedHash: string | null = null;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(
        type: 'step' | 'success' | 'error' | 'info',
        step: string,
        message: string
      ) {
        const data = JSON.stringify({ type, step, message, timestamp: Date.now() });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      }

      function runStep(stepName: string, cmd: string, timeoutMs = 120_000): boolean {
        send('step', stepName, `Çalıştırılıyor...`);
        try {
          const output = run(cmd, timeoutMs);
          send('success', stepName, output || 'Tamamlandı');
          return true;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          send('error', stepName, msg);
          return false;
        }
      }

      function rollback() {
        if (!savedHash) return;
        send('info', 'rollback', 'Geri alma başlatılıyor...');
        try {
          run(`git reset --hard ${savedHash}`);
          run('npm install --prefer-offline', 180_000);
          run('npx prisma generate', 60_000);
          send('info', 'rollback', 'Geri alma tamamlandı — önceki sürüme dönüldü');
        } catch (rollbackErr) {
          const msg = rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr);
          send('error', 'rollback', `Geri alma başarısız: ${msg}`);
        }
      }

      try {
        // Step 0: Save current state for rollback
        send('step', 'backup', 'Mevcut sürüm yedekleniyor...');
        savedHash = run('git rev-parse HEAD');
        send('success', 'backup', `Yedek noktası: ${savedHash.substring(0, 7)}`);

        // Step 1: git pull
        if (!runStep('git_pull', 'git pull origin main', 30_000)) {
          rollback();
          controller.close();
          return;
        }

        // Step 2: npm install
        if (!runStep('npm_install', 'npm install', 180_000)) {
          rollback();
          controller.close();
          return;
        }

        // Step 3: prisma generate
        if (!runStep('prisma_generate', 'npx prisma generate', 60_000)) {
          rollback();
          controller.close();
          return;
        }

        // Step 4: prisma migrate (deploy for production, db push for dev)
        const migrateCmd =
          runtime === 'pm2'
            ? 'npx prisma migrate deploy'
            : 'npx prisma db push --accept-data-loss';
        if (!runStep('prisma_migrate', migrateCmd, 60_000)) {
          rollback();
          controller.close();
          return;
        }

        // Step 5: Build (only in production, skip in dev)
        if (runtime === 'pm2') {
          if (!runStep('build', 'npm run build', 300_000)) {
            rollback();
            controller.close();
            return;
          }
        } else {
          send('info', 'build', 'Dev modunda build atlanıyor');
        }

        // Step 6: Restart
        if (runtime === 'pm2') {
          send('step', 'restart', 'pm2 ile yeniden başlatılıyor...');
          try {
            // Find the pm2 process name
            const list = run('pm2 jlist', 5_000);
            const procs = JSON.parse(list) as { name: string; pm2_env?: { status: string } }[];
            const match = procs.find(
              (p) => p.pm2_env?.status === 'online'
            );
            const procName = match?.name ?? 'all';
            run(`pm2 restart ${procName}`, 15_000);
            send('success', 'restart', `pm2 restart ${procName} — başarılı`);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            send('error', 'restart', `pm2 restart başarısız: ${msg}`);
            // Don't rollback here — the build succeeded, just restart failed
            controller.close();
            return;
          }
        } else {
          send(
            'info',
            'restart',
            'Build tamamlandı, lütfen sunucuyu manuel yeniden başlatın'
          );
        }

        // Done
        const newHash = run('git rev-parse HEAD').substring(0, 7);
        send('success', 'done', `Güncelleme tamamlandı! Yeni sürüm: ${newHash}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        send('error', 'unknown', `Beklenmeyen hata: ${msg}`);
        rollback();
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
