import { NextRequest } from 'next/server';
import { requireOwner, AuthError } from '@/lib/auth/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { checkDocumentLimit, checkStorageLimit } from '@/lib/billing/plan-guard';
import { incrementDocumentCount, incrementStorageUsage } from '@/lib/billing/usage';
import { MAX_FILE_SIZE } from '@/config/constants';

interface RouteParams {
  params: Promise<{ botId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { botId } = await params;
    await requireOwner(botId);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('search')?.trim() || '';
    const type = searchParams.get('type')?.trim() || '';
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabase = createServiceRoleClient();

    let query = supabase
      .from('documents')
      .select('*', { count: 'exact' })
      .eq('bot_id', botId);

    if (search) {
      query = query.ilike('file_name', `%${search}%`);
    }

    if (type === 'url') {
      query = query.eq('file_type', 'url');
    } else if (type === 'qa') {
      query = query.eq('file_type', 'qa');
    } else if (type === 'text') {
      query = query.eq('file_type', 'text');
    } else if (type === 'file') {
      query = query.not('file_type', 'in', '("url","qa","text")');
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      return errorResponse('Failed to fetch documents', 500);
    }

    // Fetch type counts in parallel
    const [
      { count: fileCount },
      { count: urlCount },
      { count: qaCount },
      { count: textCount },
      { count: allCount },
    ] = await Promise.all([
      supabase.from('documents').select('id', { count: 'exact', head: true }).eq('bot_id', botId).not('file_type', 'in', '("url","qa","text")'),
      supabase.from('documents').select('id', { count: 'exact', head: true }).eq('bot_id', botId).eq('file_type', 'url'),
      supabase.from('documents').select('id', { count: 'exact', head: true }).eq('bot_id', botId).eq('file_type', 'qa'),
      supabase.from('documents').select('id', { count: 'exact', head: true }).eq('bot_id', botId).eq('file_type', 'text'),
      supabase.from('documents').select('id', { count: 'exact', head: true }).eq('bot_id', botId),
    ]);

    return successResponse({
      documents: data,
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
      counts: {
        all: allCount ?? 0,
        file: fileCount ?? 0,
        url: urlCount ?? 0,
        qa: qaCount ?? 0,
        text: textCount ?? 0,
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { botId } = await params;
    const user = await requireOwner(botId);

    const supabase = createServiceRoleClient();
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return errorResponse('No file provided');
    }

    if (file.size > MAX_FILE_SIZE) {
      return errorResponse(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
    }

    // Check plan limits
    const docCheck = await checkDocumentLimit(user.id, botId);
    if (!docCheck.allowed) {
      return errorResponse(
        `Document limit reached (${docCheck.max}). Upgrade your plan.`,
        403
      );
    }

    const storageCheck = await checkStorageLimit(user.id, file.size);
    if (!storageCheck.allowed) {
      return errorResponse(
        `Storage limit reached (${storageCheck.maxMb} MB). Upgrade your plan.`,
        403
      );
    }

    // Upload to Supabase Storage
    const ext = file.name.split('.').pop() || 'pdf';
    const safeFileName = `${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const storagePath = `${botId}/${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file);

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return errorResponse(`Failed to upload file: ${uploadError.message}`, 500);
    }

    // Determine file_type from extension
    let fileType = 'text';
    if (ext === 'pdf') fileType = 'pdf';
    else if (ext === 'html' || ext === 'htm') fileType = 'html';

    const { data: doc, error: dbError } = await supabase
      .from('documents')
      .insert({
        bot_id: botId,
        file_name: file.name,
        file_type: fileType,
        file_size: file.size,
        storage_path: storagePath,
        status: 'pending',
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB insert error:', dbError);
      return errorResponse(`Failed to create document record: ${dbError.message}`, 500);
    }

    // Track usage
    await incrementDocumentCount(user.id);
    await incrementStorageUsage(user.id, file.size);

    return successResponse(doc, 201);
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Internal server error', 500);
  }
}
