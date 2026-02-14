import { requireAdmin, AuthError } from '@/lib/auth/guards';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { successResponse, errorResponse } from '@/lib/api/response';

/**
 * GET /api/sys/system-status
 * System admin: DB health, vector DB size, storage usage, totals.
 */
export async function GET() {
  try {
    await requireAdmin();
    const supabase = createServiceRoleClient();

    // Run all queries in parallel
    const [
      dbHealth,
      chunkCount,
      userCount,
      botCount,
      docCount,
      convCount,
      logCount,
    ] = await Promise.all([
      // DB connection test
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      // Vector DB size (document_chunks count)
      supabase.from('document_chunks').select('id', { count: 'exact', head: true }),
      // Total users
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      // Total bots
      supabase.from('bots').select('id', { count: 'exact', head: true }),
      // Total documents
      supabase.from('documents').select('id', { count: 'exact', head: true }),
      // Total conversations
      supabase.from('conversations').select('id', { count: 'exact', head: true }),
      // Recent errors (last 24h)
      supabase
        .from('system_logs')
        .select('id', { count: 'exact', head: true })
        .eq('level', 'error')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ]);

    // Storage usage: sum of all document file sizes
    const { data: docs } = await supabase
      .from('documents')
      .select('file_size');

    const totalStorageBytes = (docs ?? []).reduce((sum, d) => sum + (d.file_size ?? 0), 0);
    const totalStorageMb = Math.round((totalStorageBytes / (1024 * 1024)) * 100) / 100;

    return successResponse({
      database: {
        status: dbHealth.error ? 'error' : 'healthy',
        error: dbHealth.error?.message ?? null,
      },
      counts: {
        users: userCount.count ?? 0,
        bots: botCount.count ?? 0,
        documents: docCount.count ?? 0,
        document_chunks: chunkCount.count ?? 0,
        conversations: convCount.count ?? 0,
      },
      storage: {
        total_mb: totalStorageMb,
        total_gb: Math.round((totalStorageMb / 1024) * 100) / 100,
      },
      errors_24h: logCount.count ?? 0,
      checked_at: new Date().toISOString(),
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    console.error('sys/system-status error:', err);
    return errorResponse('Failed to fetch system status', 500);
  }
}
