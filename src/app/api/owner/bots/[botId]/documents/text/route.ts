import { NextRequest } from 'next/server';
import { requireOwner, AuthError } from '@/lib/auth/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { checkDocumentLimit, checkStorageLimit } from '@/lib/billing/plan-guard';
import { incrementDocumentCount, incrementStorageUsage } from '@/lib/billing/usage';
import { processDocument } from '@/lib/rag/pipeline';

export const maxDuration = 300;

export async function POST(request: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  try {
    const { botId } = await params;
    const user = await requireOwner(botId);

    const body = await request.json();
    const { title, content } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return errorResponse('Title is required');
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      return errorResponse('Content is required');
    }

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    // Check plan limits
    const docCheck = await checkDocumentLimit(user.id, botId);
    if (!docCheck.allowed) {
      return errorResponse(
        `Document limit reached (${docCheck.max}). Upgrade your plan.`,
        403
      );
    }

    const contentBuffer = Buffer.from(trimmedContent, 'utf-8');
    const fileSize = contentBuffer.byteLength;

    const storageCheck = await checkStorageLimit(user.id, fileSize);
    if (!storageCheck.allowed) {
      return errorResponse(
        `Storage limit reached (${storageCheck.maxMb} MB). Upgrade your plan.`,
        403
      );
    }

    const supabase = createServiceRoleClient();

    // Upload content as .txt to Supabase Storage
    const safeFileName = `${Date.now()}_${crypto.randomUUID().slice(0, 8)}.txt`;
    const storagePath = `${botId}/${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, contentBuffer, {
        contentType: 'text/plain; charset=utf-8',
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return errorResponse(`Failed to upload text: ${uploadError.message}`, 500);
    }

    // Create document record
    const { data: doc, error: dbError } = await supabase
      .from('documents')
      .insert({
        bot_id: botId,
        file_name: trimmedTitle,
        file_type: 'text',
        file_size: fileSize,
        storage_path: storagePath,
        status: 'pending',
      })
      .select()
      .single();

    if (dbError || !doc) {
      console.error('DB insert error:', dbError);
      return errorResponse('Failed to create document record', 500);
    }

    // Track usage
    await incrementDocumentCount(user.id);
    await incrementStorageUsage(user.id, fileSize);

    // Process immediately (same pattern as crawl)
    try {
      const result = await processDocument(doc.id, botId);
      return successResponse({ ...doc, ...result }, 201);
    } catch (processError) {
      const message = processError instanceof Error ? processError.message : 'Processing failed';
      return errorResponse(message, 500);
    }
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Internal server error', 500);
  }
}
