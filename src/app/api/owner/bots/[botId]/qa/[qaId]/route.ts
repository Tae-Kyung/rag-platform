import { NextRequest } from 'next/server';
import { requireOwner, AuthError } from '@/lib/auth/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { generateEmbedding, generateEmbeddings } from '@/lib/rag/embeddings';
import { chunkText } from '@/lib/rag/chunker';

export const maxDuration = 60;

interface RouteParams {
  params: Promise<{ botId: string; qaId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { botId, qaId } = await params;
    await requireOwner(botId);

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('qa_pairs')
      .select('*')
      .eq('id', qaId)
      .eq('bot_id', botId)
      .single();

    if (error || !data) {
      return errorResponse('Q&A pair not found', 404);
    }

    return successResponse(data);
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Internal server error', 500);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { botId, qaId } = await params;
    await requireOwner(botId);

    const body = await request.json();
    const { question, answer, category } = body;

    if (!question?.trim() || !answer?.trim()) {
      return errorResponse('Question and answer are required');
    }

    const supabase = createServiceRoleClient();

    // Verify the QA pair exists and belongs to this bot
    const { data: existing, error: findErr } = await supabase
      .from('qa_pairs')
      .select('id, document_id')
      .eq('id', qaId)
      .eq('bot_id', botId)
      .single();

    if (findErr || !existing) {
      return errorResponse('Q&A pair not found', 404);
    }

    // Update qa_pairs record
    const { data: updated, error: updateErr } = await supabase
      .from('qa_pairs')
      .update({
        question: question.trim(),
        answer: answer.trim(),
        category: category?.trim() || null,
      })
      .eq('id', qaId)
      .select()
      .single();

    if (updateErr) {
      return errorResponse(`Failed to update Q&A: ${updateErr.message}`, 500);
    }

    // Update linked document file_name
    const docId = existing.document_id;
    if (docId) {
      await supabase
        .from('documents')
        .update({
          file_name: `Q&A: ${question.trim().substring(0, 50)}`,
          status: 'processing',
        })
        .eq('id', docId);

      // Re-generate embeddings: delete old chunks, create new ones
      try {
        await supabase
          .from('document_chunks')
          .delete()
          .eq('document_id', docId);

        const fullContent = `Q: ${question.trim()}\nA: ${answer.trim()}`;

        if (fullContent.length <= 2000) {
          const embedding = await generateEmbedding(fullContent);
          await supabase.from('document_chunks').insert({
            document_id: docId,
            bot_id: botId,
            content: fullContent,
            metadata: { type: 'qa', question: question.trim(), file_name: `Q&A: ${question.trim().substring(0, 50)}` },
            embedding: JSON.stringify(embedding),
          });
        } else {
          const chunks = chunkText(answer.trim(), { chunkSize: 500, chunkOverlap: 50 });
          const chunkContents = chunks.map(
            (c, i) => `Q: ${question.trim()}\nA (${i + 1}/${chunks.length}): ${c.content}`
          );
          const embeddings = await generateEmbeddings(chunkContents);

          const batch = chunkContents.map((content, j) => ({
            document_id: docId,
            bot_id: botId,
            content,
            metadata: {
              type: 'qa',
              question: question.trim(),
              file_name: `Q&A: ${question.trim().substring(0, 50)}`,
              chunk_index: j,
            },
            embedding: JSON.stringify(embeddings[j]),
          }));

          const { error: insertErr } = await supabase
            .from('document_chunks')
            .insert(batch);

          if (insertErr) {
            throw new Error(insertErr.message);
          }
        }

        const chunkCount = fullContent.length <= 2000 ? 1 : Math.ceil(answer.trim().length / 500);
        await supabase
          .from('documents')
          .update({ status: 'completed', chunk_count: chunkCount })
          .eq('id', docId);
      } catch (embErr) {
        const msg = embErr instanceof Error ? embErr.message : 'Embedding failed';
        await supabase
          .from('documents')
          .update({ status: 'failed', error_message: msg })
          .eq('id', docId);
      }
    }

    return successResponse(updated);
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Internal server error', 500);
  }
}
