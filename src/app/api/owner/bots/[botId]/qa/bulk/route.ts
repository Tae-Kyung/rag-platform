import { NextRequest } from 'next/server';
import { requireOwner, AuthError } from '@/lib/auth/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { checkDocumentLimit } from '@/lib/billing/plan-guard';
import { incrementDocumentCount } from '@/lib/billing/usage';
import { generateEmbedding, generateEmbeddings } from '@/lib/rag/embeddings';
import { chunkText } from '@/lib/rag/chunker';

export const maxDuration = 60;

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
    const results: { success: number; failed: number; errors: string[] } = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const item of items) {
      try {
        const question = item.question.trim();
        const answer = item.answer.trim();
        const category = item.category?.trim() || null;

        // Create Q&A pair
        const { error: qaError } = await supabase
          .from('qa_pairs')
          .insert({ bot_id: botId, question, answer, category });

        if (qaError) {
          results.failed++;
          results.errors.push(`"${question.substring(0, 30)}...": ${qaError.message}`);
          continue;
        }

        // Create document record
        const { data: doc, error: docError } = await supabase
          .from('documents')
          .insert({
            bot_id: botId,
            file_name: `Q&A: ${question.substring(0, 50)}`,
            file_type: 'qa',
            status: 'processing',
          })
          .select()
          .single();

        if (docError || !doc) {
          results.success++;
          continue;
        }

        await incrementDocumentCount(user.id);

        // Generate embeddings
        try {
          const fullContent = `Q: ${question}\nA: ${answer}`;

          if (fullContent.length <= 2000) {
            const embedding = await generateEmbedding(fullContent);
            await supabase.from('document_chunks').insert({
              document_id: doc.id,
              bot_id: botId,
              content: fullContent,
              metadata: { type: 'qa', question, file_name: `Q&A: ${question.substring(0, 50)}` },
              embedding: JSON.stringify(embedding),
            });
          } else {
            const chunks = chunkText(answer, { chunkSize: 500, chunkOverlap: 50 });
            const chunkContents = chunks.map(
              (c, i) => `Q: ${question}\nA (${i + 1}/${chunks.length}): ${c.content}`
            );
            const embeddings = await generateEmbeddings(chunkContents);

            const batchSize = 50;
            for (let i = 0; i < chunkContents.length; i += batchSize) {
              const batch = chunkContents.slice(i, i + batchSize).map((content, j) => ({
                document_id: doc.id,
                bot_id: botId,
                content,
                metadata: {
                  type: 'qa',
                  question,
                  file_name: `Q&A: ${question.substring(0, 50)}`,
                  chunk_index: i + j,
                },
                embedding: JSON.stringify(embeddings[i + j]),
              }));

              await supabase.from('document_chunks').insert(batch);
            }
          }

          const chunkCount = fullContent.length <= 2000 ? 1 : Math.ceil(answer.length / 500);
          await supabase
            .from('documents')
            .update({ status: 'completed', chunk_count: chunkCount })
            .eq('id', doc.id);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to process Q&A';
          await supabase
            .from('documents')
            .update({ status: 'failed', error_message: message })
            .eq('id', doc.id);
        }

        results.success++;
      } catch {
        results.failed++;
      }
    }

    return successResponse(results, 201);
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Internal server error', 500);
  }
}
