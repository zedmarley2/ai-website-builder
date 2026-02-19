import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import {
  getCurrentVersion,
  getServerUptime,
  isGitRepo,
  checkGitInstalled,
  checkPm2Installed,
  checkPgDumpInstalled,
  isLocked,
  checkAndCleanStaleLocks,
} from '@/lib/update-utils';

/**
 * GET /api/admin/update/status
 * Guncelleme sistemi durum bilgilerini dondurur.
 * Surum, uptime, on kosullar, kilit durumu ve son guncelleme kaydi.
 */
export async function GET() {
  const { error, status } = await requireAdmin();
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    // Eski kilitlenme kayitlarini temizle
    await checkAndCleanStaleLocks();

    // Paralel olarak tum bilgileri topla
    const [
      versionInfo,
      hasGit,
      hasPm2,
      hasPgDump,
      lastUpdate,
    ] = await Promise.all([
      getCurrentVersion(),
      checkGitInstalled(),
      checkPm2Installed(),
      checkPgDumpInstalled(),
      prisma.updateLog.findFirst({
        orderBy: { startedAt: 'desc' },
      }),
    ]);

    const uptime = getServerUptime();
    const gitRepo = isGitRepo();
    const isUpdateInProgress = isLocked();
    const repoUrl = process.env.GITHUB_REPO_URL ?? '';

    return NextResponse.json({
      data: {
        version: versionInfo.version,
        commitHash: versionInfo.commitHash,
        commitDate: versionInfo.commitDate,
        branch: versionInfo.branch,
        uptime,
        isGitRepo: gitRepo,
        hasGit,
        hasPm2,
        hasPgDump,
        isUpdateInProgress,
        lastUpdate,
        repoUrl,
      },
    });
  } catch (err) {
    console.error('Guncelleme durumu sorgu hatasi:', err);
    return NextResponse.json(
      { error: 'Sunucu hatasi' },
      { status: 500 }
    );
  }
}
