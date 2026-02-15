import { NextRequest } from 'next/server';
import { requireOwner, AuthError } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/api/response';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { checkDocumentLimit } from '@/lib/billing/plan-guard';
import { incrementDocumentCount } from '@/lib/billing/usage';
import { generateEmbeddings } from '@/lib/rag/embeddings';
import { EMBEDDING_BATCH_SIZE } from '@/config/constants';

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
  // Pre-validate before streaming
  let botId: string;
  let userId: string;
  let items: QAItem[];

  try {
    botId = (await params).botId;
    const user = await requireOwner(botId);
    userId = user.id;

    const body = await request.json();
    items = body.items as QAItem[];

    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse('items array is required and must not be empty');
    }

    if (items.length > 500) {
      return errorResponse('Maximum 500 Q&A pairs per upload');
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.question?.trim() || !item.answer?.trim()) {
        return errorResponse(`Row ${i + 1}: question and answer are required`);
      }
    }

    const limitCheck = await checkDocumentLimit(userId, botId);
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
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Internal server error', 500);
  }

  // Stream progress back to client
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        const total = items.length;
        const supabase = createServiceRoleClient();

        // Phase 1: Insert document records
        send({ phase: 'docs', message: 'Creating records...', progress: 5, current: 0, total });

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
          send({ phase: 'error', message: `Failed to create records: ${docsInsertError?.message}` });
          controller.close();
          return;
        }

        // Phase 2: Insert qa_pairs in batches
        send({ phase: 'qa', message: 'Saving Q&A pairs...', progress: 8, current: 0, total });

        const qaBatchSize = 100;
        for (let qi = 0; qi < items.length; qi += qaBatchSize) {
          const qaBatch = items.slice(qi, qi + qaBatchSize).map((item, j) => ({
            bot_id: botId,
            question: item.question.trim(),
            answer: item.answer.trim(),
            category: item.category?.trim() || null,
            document_id: docs[qi + j].id,
          }));

          const { error: qaInsertError } = await supabase
            .from('qa_pairs')
            .insert(qaBatch);

          if (qaInsertError) {
            await supabase.from('documents').delete().in('id', docs.map((d) => d.id));
            send({ phase: 'error', message: `Failed to save Q&A: ${qaInsertError.message}` });
            controller.close();
            return;
          }

          const qaDone = Math.min(qi + qaBatchSize, total);
          send({ phase: 'qa', message: `Saving Q&A pairs... (${qaDone}/${total})`, progress: 8 + Math.round((qaDone / total) * 5), current: qaDone, total });
        }

        // Track usage (single DB call)
        await incrementDocumentCount(userId, docs.length);

        // Phase 3: Generate embeddings in batches with progress
        const contents = items.map(
          (item) => `Q: ${item.question.trim()}\nA: ${item.answer.trim()}`
        );

        const embeddingBatches = Math.ceil(contents.length / EMBEDDING_BATCH_SIZE);
        const allEmbeddings: number[][] = [];

        send({ phase: 'embedding', message: 'Generating embeddings...', progress: 15, current: 0, total });

        try {
          for (let b = 0; b < embeddingBatches; b++) {
            const batchStart = b * EMBEDDING_BATCH_SIZE;
            const batch = contents.slice(batchStart, batchStart + EMBEDDING_BATCH_SIZE);
            const batchEmbeddings = await generateEmbeddings(batch);
            allEmbeddings.push(...batchEmbeddings);

            const embeddingsDone = Math.min((b + 1) * EMBEDDING_BATCH_SIZE, total);
            const progress = 15 + Math.round((embeddingsDone / total) * 65);
            send({
              phase: 'embedding',
              message: `Generating embeddings... (${embeddingsDone}/${total})`,
              progress,
              current: embeddingsDone,
              total,
            });
          }
        } catch (err) {
          await supabase
            .from('documents')
            .update({
              status: 'failed',
              error_message: err instanceof Error ? err.message : 'Embedding generation failed',
            })
            .in('id', docs.map((d) => d.id));
          send({ phase: 'error', message: 'Failed to generate embeddings. Q&A data saved but not indexed.' });
          controller.close();
          return;
        }

        // Phase 4: Insert chunks
        send({ phase: 'saving', message: 'Saving to database...', progress: 85, current: 0, total });

        const chunksToInsert = docs.map((doc, i) => ({
          document_id: doc.id,
          bot_id: botId,
          content: contents[i],
          metadata: {
            type: 'qa',
            question: items[i].question.trim(),
            file_name: `Q&A: ${items[i].question.trim().substring(0, 50)}`,
          },
          embedding: JSON.stringify(allEmbeddings[i]),
        }));

        const chunkBatchSize = 50;
        for (let i = 0; i < chunksToInsert.length; i += chunkBatchSize) {
          const batch = chunksToInsert.slice(i, i + chunkBatchSize);
          const { error: chunkError } = await supabase
            .from('document_chunks')
            .insert(batch);

          if (chunkError) {
            const failedDocIds = docs.slice(i).map((d) => d.id);
            await supabase
              .from('documents')
              .update({ status: 'failed', error_message: chunkError.message })
              .in('id', failedDocIds);
          }

          const chunksDone = Math.min(i + chunkBatchSize, total);
          const progress = 85 + Math.round((chunksDone / total) * 10);
          send({ phase: 'saving', message: `Saving to database... (${chunksDone}/${total})`, progress, current: chunksDone, total });
        }

        // Phase 5: Mark completed
        await supabase
          .from('documents')
          .update({ status: 'completed', chunk_count: 1 })
          .eq('bot_id', botId)
          .eq('status', 'processing')
          .in('id', docs.map((d) => d.id));

        send({ phase: 'done', message: 'Complete!', progress: 100, success: total, failed: 0 });
      } catch (err) {
        send({ phase: 'error', message: err instanceof Error ? err.message : 'Internal server error' });
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
