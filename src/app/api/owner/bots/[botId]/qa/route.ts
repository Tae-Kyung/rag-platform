import { NextRequest } from 'next/server';
import { requireOwner, AuthError } from '@/lib/auth/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { checkQALimit } from '@/lib/billing/plan-guard';
import { incrementDocumentCount } from '@/lib/billing/usage';
import { generateEmbedding, generateEmbeddings } from '@/lib/rag/embeddings';
import { chunkText } from '@/lib/rag/chunker';

export const maxDuration = 60;

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
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabase = createServiceRoleClient();

    const { data, error, count } = await supabase
      .from('qa_pairs')
      .select('*', { count: 'exact' })
      .eq('bot_id', botId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      return errorResponse('Failed to fetch Q&A pairs', 500);
    }

    return successResponse({
      qa_pairs: data,
      total: count ?? 0,
      page,
      limit,
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

    const body = await request.json();
    const { question, answer, category } = body;

    if (!question || !answer) {
      return errorResponse('Question and answer are required');
    }

    // Check document limit (Q&A counts as a document)
    const qaCheck = await checkQALimit(user.id, botId);
    if (!qaCheck.allowed) {
      return errorResponse('Document limit reached. Upgrade your plan to add more Q&A.', 403);
    }

    const supabase = createServiceRoleClient();

    // Create Q&A pair
    const { data: qaPair, error: qaError } = await supabase
      .from('qa_pairs')
      .insert({
        bot_id: botId,
        question,
        answer,
        category: category || null,
      })
      .select()
      .single();

    if (qaError) {
      return errorResponse(`Failed to create Q&A: ${qaError.message}`, 500);
    }

    // Create document record for RAG
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
      return successResponse(qaPair, 201); // Q&A saved, embedding failed silently
    }

    // Track document usage
    await incrementDocumentCount(user.id);

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

          const { error: insertError } = await supabase
            .from('document_chunks')
            .insert(batch);

          if (insertError) {
            throw new Error(`Failed to insert chunks: ${insertError.message}`);
          }
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

    return successResponse(qaPair, 201);
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Internal server error', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { botId } = await params;
    await requireOwner(botId);

    const { searchParams } = new URL(request.url);
    const qaId = searchParams.get('id');

    if (!qaId) {
      return errorResponse('Q&A ID required');
    }

    const supabase = createServiceRoleClient();

    // Delete Q&A pair
    const { error } = await supabase
      .from('qa_pairs')
      .delete()
      .eq('id', qaId)
      .eq('bot_id', botId);

    if (error) {
      return errorResponse(`Failed to delete Q&A: ${error.message}`, 500);
    }

    // Delete associated Q&A documents and chunks
    const { data: docs } = await supabase
      .from('documents')
      .select('id')
      .eq('bot_id', botId)
      .eq('file_type', 'qa')
      .ilike('file_name', `%${qaId.substring(0, 8)}%`);

    if (docs && docs.length > 0) {
      await supabase
        .from('documents')
        .delete()
        .in('id', docs.map((d) => d.id));
    }

    return successResponse({ deleted: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Internal server error', 500);
  }
}
