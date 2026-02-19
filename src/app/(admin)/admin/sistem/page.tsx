'use client';

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  RefreshCw,
  Download,
  CheckCircle2,
  XCircle,
  Info,
  Loader2,
  GitBranch,
  Server,
  AlertTriangle,
} from 'lucide-react';

/* ─── Types ─── */

interface UpdateInfo {
  currentVersion: string;
  localHash: string;
  remoteHash: string;
  updateAvailable: boolean;
  behindCount: number;
  commits: { hash: string; message: string; date: string }[];
  runtime: 'pm2' | 'dev';
}

interface LogEntry {
  type: 'step' | 'success' | 'error' | 'info';
  step: string;
  message: string;
  timestamp: number;
}

const STEP_LABELS: Record<string, string> = {
  backup: 'Yedekleme',
  git_pull: 'Git Pull',
  npm_install: 'Bağımlılık Kurulumu',
  prisma_generate: 'Prisma Generate',
  prisma_migrate: 'Veritabanı Migrasyon',
  build: 'Build',
  restart: 'Yeniden Başlatma',
  rollback: 'Geri Alma',
  done: 'Tamamlandı',
};

/* ─── Component ─── */

export default function AdminSystemPage() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [finished, setFinished] = useState(false);

  /* Check for updates */
  const checkUpdates = useCallback(async () => {
    setChecking(true);
    setUpdateInfo(null);
    setLogs([]);
    setFinished(false);
    try {
      const res = await fetch('/api/admin/system/update');
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? 'Kontrol başarısız');
        return;
      }
      const { data } = await res.json();
      setUpdateInfo(data);
      if (!data.updateAvailable) {
        toast.success('Sistem güncel!');
      }
    } catch {
      toast.error('Güncelleme kontrolü başarısız');
    } finally {
      setChecking(false);
    }
  }, []);

  /* Execute update via SSE */
  const executeUpdate = useCallback(async () => {
    if (updating) return;
    setUpdating(true);
    setLogs([]);
    setFinished(false);

    try {
      const res = await fetch('/api/admin/system/update', { method: 'POST' });
      if (!res.body) {
        toast.error('Stream başlatılamadı');
        setUpdating(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.replace(/^data:\s*/, '').trim();
          if (!trimmed) continue;
          try {
            const entry: LogEntry = JSON.parse(trimmed);
            setLogs((prev) => [...prev, entry]);
          } catch {
            // skip malformed line
          }
        }
      }
    } catch {
      toast.error('Güncelleme bağlantısı kesildi');
    } finally {
      setUpdating(false);
      setFinished(true);
    }
  }, [updating]);

  const hasError = logs.some((l) => l.type === 'error');
  const isDone = logs.some((l) => l.step === 'done' && l.type === 'success');

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Yönetim Paneli /{' '}
          <span className="text-[#1a365d] dark:text-[#d4a843]">Sistem</span>
        </p>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Sistem Güncelleme
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Uygulama güncellemelerini kontrol edin ve uygulayın
            </p>
          </div>
          <button
            type="button"
            disabled={checking || updating}
            onClick={checkUpdates}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1a365d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1a365d]/90 disabled:opacity-50"
          >
            {checking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Güncelleme Kontrol Et
          </button>
        </div>
      </div>

      {/* Current info card */}
      {updateInfo && (
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-sm dark:border-[#334155] dark:bg-[#1e293b]">
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Version */}
            <div className="flex items-start gap-3">
              <GitBranch className="mt-0.5 h-5 w-5 text-[#d4a843]" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Mevcut Sürüm
                </p>
                <p className="mt-0.5 text-lg font-bold text-gray-900 dark:text-white">
                  {updateInfo.currentVersion}
                </p>
                <p className="text-xs text-gray-400">
                  {updateInfo.localHash} → {updateInfo.remoteHash}
                </p>
              </div>
            </div>

            {/* Runtime */}
            <div className="flex items-start gap-3">
              <Server className="mt-0.5 h-5 w-5 text-[#d4a843]" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Çalışma Modu
                </p>
                <p className="mt-0.5 text-lg font-bold text-gray-900 dark:text-white">
                  {updateInfo.runtime === 'pm2' ? 'Production (PM2)' : 'Development'}
                </p>
                <p className="text-xs text-gray-400">
                  {updateInfo.runtime === 'pm2'
                    ? 'Otomatik yeniden başlatma yapılacak'
                    : 'Manuel yeniden başlatma gerekecek'}
                </p>
              </div>
            </div>

            {/* Update status */}
            <div className="flex items-start gap-3">
              {updateInfo.updateAvailable ? (
                <Download className="mt-0.5 h-5 w-5 text-amber-500" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-500" />
              )}
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Durum
                </p>
                <p
                  className={`mt-0.5 text-lg font-bold ${
                    updateInfo.updateAvailable
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  {updateInfo.updateAvailable
                    ? `${updateInfo.behindCount} güncelleme mevcut`
                    : 'Sistem güncel'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Commits list */}
      {updateInfo?.updateAvailable && updateInfo.commits.length > 0 && (
        <div className="rounded-xl border border-[#e2e8f0] bg-white shadow-sm dark:border-[#334155] dark:bg-[#1e293b]">
          <div className="border-b border-[#e2e8f0] px-6 py-4 dark:border-[#334155]">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Bekleyen Değişiklikler
            </h2>
          </div>
          <ul className="divide-y divide-[#e2e8f0] dark:divide-[#334155]">
            {updateInfo.commits.map((c) => (
              <li key={c.hash} className="flex items-center gap-3 px-6 py-3">
                <code className="flex-shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-[#1a365d] dark:bg-[#0f172a] dark:text-[#d4a843]">
                  {c.hash}
                </code>
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                  {c.message}
                </span>
                <span className="flex-shrink-0 text-xs text-gray-400">
                  {new Date(c.date).toLocaleDateString('tr-TR')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Execute update button */}
      {updateInfo?.updateAvailable && !updating && !isDone && (
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={executeUpdate}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-700"
          >
            <Download className="h-4 w-4" />
            Güncellemeyi Uygula
          </button>
          {updateInfo.runtime === 'dev' && (
            <p className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              Dev modunda güncelleme sonrası sunucuyu manuel yeniden başlatmanız gerekecek
            </p>
          )}
        </div>
      )}

      {/* Progress log */}
      {(logs.length > 0 || updating) && (
        <div className="rounded-xl border border-[#e2e8f0] bg-white shadow-sm dark:border-[#334155] dark:bg-[#1e293b]">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-4 dark:border-[#334155]">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Güncelleme İlerlemesi
            </h2>
            {updating && <Loader2 className="h-5 w-5 animate-spin text-[#d4a843]" />}
            {finished && !hasError && isDone && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            {finished && hasError && <XCircle className="h-5 w-5 text-red-500" />}
          </div>
          <div className="max-h-96 overflow-y-auto p-4">
            <ul className="space-y-2">
              {logs.map((entry, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  {entry.type === 'step' && (
                    <Loader2 className="mt-0.5 h-4 w-4 flex-shrink-0 animate-spin text-blue-500" />
                  )}
                  {entry.type === 'success' && (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                  )}
                  {entry.type === 'error' && (
                    <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                  )}
                  {entry.type === 'info' && (
                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {STEP_LABELS[entry.step] ?? entry.step}
                    </span>
                    <span className="ml-2 text-gray-500 dark:text-gray-400">
                      {entry.message}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
