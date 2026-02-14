import { NextRequest } from 'next/server';
import { requireOwner, AuthError } from '@/lib/auth/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { checkDocumentLimit } from '@/lib/billing/plan-guard';
import { incrementDocumentCount } from '@/lib/billing/usage';
import { generateEmbeddings } from '@/lib/rag/embeddings';

export const maxDuration = 300;

interface QAItem {
  question: string;
  answer: string;
  category?: string;
}

interface RouteParams {
  params: Promise<{ botId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { botId } = await params;
    const user = await requireOwner(botId);

    const body = await request.json();
    const { items } = body as { items: QAItem[] };

    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse('items array is required and must not be empty');
    }

    if (items.length > 500) {
      return errorResponse('Maximum 500 Q&A pairs per upload');
    }

    // Validate all items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.question?.trim() || !item.answer?.trim()) {
        return errorResponse(`Row ${i + 1}: question and answer are required`);
      }
    }

    // Check document limit for all items at once
    const limitCheck = await checkDocumentLimit(user.id, botId);
    if (!limitCheck.allowed) {
      return errorResponse('Document limit reached. Upgrade your plan to add more Q&A.', 403);
    }
    if (limitCheck.max !== -1 && limitCheck.current + items.length > limitCheck.max) {
      const remaining = limitCheck.max - limitCheck.current;
      return errorResponse(
        `Document limit: you can add ${remaining} more document(s). Tried to add ${items.length}.`,
        403
      );
    }

    const supabase = createServiceRoleClient();

    // --- Phase 1: Batch insert all qa_pairs ---
    const qaPairsToInsert = items.map((item) => ({
      bot_id: botId,
      question: item.question.trim(),
      answer: item.answer.trim(),
      category: item.category?.trim() || null,
    }));

    const { error: qaInsertError } = await supabase
      .from('qa_pairs')
      .insert(qaPairsToInsert);

    if (qaInsertError) {
      return errorResponse(`Failed to insert Q&A pairs: ${qaInsertError.message}`, 500);
    }

    // --- Phase 2: Batch insert all document records ---
    const docsToInsert = items.map((item) => ({
      bot_id: botId,
      file_name: `Q&A: ${item.question.trim().substring(0, 50)}`,
      file_type: 'qa' as const,
      status: 'processing' as const,
    }));

    const { data: docs, error: docsInsertError } = await supabase
      .from('documents')
      .insert(docsToInsert)
      .select('id');

    if (docsInsertError || !docs) {
      return errorResponse(`Failed to create document records: ${docsInsertError?.message}`, 500);
    }

    // Track usage
    for (let i = 0; i < docs.length; i++) {
      await incrementDocumentCount(user.id);
    }

    // --- Phase 3: Batch generate all embeddings at once ---
    const contents = items.map(
      (item) => `Q: ${item.question.trim()}\nA: ${item.answer.trim()}`
    );

    let embeddings: number[][];
    try {
      embeddings = await generateEmbeddings(contents);
    } catch (err) {
      // Mark all docs as failed
      await supabase
        .from('documents')
        .update({
          status: 'failed',
          error_message: err instanceof Error ? err.message : 'Embedding generation failed',
        })
        .in('id', docs.map((d) => d.id));

      return errorResponse('Failed to generate embeddings. Q&A data was saved but not indexed.', 500);
    }

    // --- Phase 4: Batch insert all chunks ---
    const chunksToInsert = docs.map((doc, i) => ({
      document_id: doc.id,
      bot_id: botId,
      content: contents[i],
      metadata: {
        type: 'qa',
        question: items[i].question.trim(),
        file_name: `Q&A: ${items[i].question.trim().substring(0, 50)}`,
      },
      embedding: JSON.stringify(embeddings[i]),
    }));

    // Insert chunks in batches of 50
    const batchSize = 50;
    for (let i = 0; i < chunksToInsert.length; i += batchSize) {
      const batch = chunksToInsert.slice(i, i + batchSize);
      const { error: chunkError } = await supabase
        .from('document_chunks')
        .insert(batch);

      if (chunkError) {
        // Mark remaining docs as failed
        const failedDocIds = docs.slice(i).map((d) => d.id);
        await supabase
          .from('documents')
          .update({ status: 'failed', error_message: chunkError.message })
          .in('id', failedDocIds);
      }
    }

    // --- Phase 5: Mark all docs as completed ---
    await supabase
      .from('documents')
      .update({ status: 'completed', chunk_count: 1 })
      .eq('bot_id', botId)
      .eq('status', 'processing')
      .in('id', docs.map((d) => d.id));

    return successResponse(
      { success: items.length, failed: 0, errors: [] },
      201
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Internal server error', 500);
  }
}
