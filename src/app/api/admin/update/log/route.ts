import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/update/log
 * Guncelleme kayitlarini sayfalama ile dondurur.
 * En yeni kayitlar basta olacak sekilde siralanir.
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

    const [logs, total] = await Promise.all([
      prisma.updateLog.findMany({
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.updateLog.count(),
    ]);

    return NextResponse.json({
      data: logs,
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error('Guncelleme kayitlari sorgulama hatasi:', err);
    return NextResponse.json(
      { error: 'Sunucu hatasi' },
      { status: 500 }
    );
  }
}
