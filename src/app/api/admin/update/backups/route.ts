import { NextRequest, NextResponse } from 'next/server';
import { existsSync } from 'node:fs';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/update/backups
 * Yedek listesini sayfalama ile dondurur.
 * Her yedek icin dosyalarin diskte mevcut olup olmadigini kontrol eder.
 * Query params: page, limit
 */
export async function GET(request: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const skip = (page - 1) * limit;

    const [backups, total] = await Promise.all([
      prisma.backup.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.backup.count(),
    ]);

    // Her yedek icin dosya durumunu kontrol et
    const backupsWithStatus = backups.map((backup) => ({
      ...backup,
      filesExist: existsSync(backup.path),
      dbFileExists: existsSync(backup.dbPath),
    }));

    return NextResponse.json({
      data: backupsWithStatus,
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error('Yedek listesi sorgulama hatasi:', err);
    return NextResponse.json(
      { error: 'Sunucu hatasi' },
      { status: 500 }
    );
  }
}
