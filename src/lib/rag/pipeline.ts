import { parsePDF, crawlURL } from './parser';
import { chunkText } from './chunker';
import { generateEmbeddings } from './embeddings';
import {
  classifyDocument,
  getChunkOverlap,
  preprocessByLanguage,
} from './language';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { PIPELINE_INSERT_BATCH_SIZE } from '@/config/constants';
import { restructureWithAI } from './pipeline-restructure';
import { summarizeTables } from './pipeline-tables';

export interface ProcessOptions {
  useVision?: boolean;
}

interface ChunkStrategy {
  chunkSize?: number;
  chunkOverlap?: number;
  separator?: string;
}

export async function processDocument(
  documentId: string,
  botId: string,
  options: ProcessOptions = {}
) {
  const { useVision = false } = options;
  const supabase = createServiceRoleClient();

  await supabase
    .from('documents')
    .update({ status: 'processing' })
    .eq('id', documentId);

  try {
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !doc) {
      throw new Error(`Document not found: ${docError?.message || 'no data'}`);
    }

    console.log(`[Pipeline] Processing: ${doc.file_name} (type: ${doc.file_type})`);

    let text = '';
    let pageTitle: string | undefined;

    if (doc.file_type === 'url') {
      const url = doc.source_url || doc.file_name;
      const crawlResult = await crawlURL(url);
      text = crawlResult.text;
      pageTitle = crawlResult.title;
    } else if (doc.storage_path) {
      console.log(`[Pipeline] Downloading from storage: ${doc.storage_path}`);
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(doc.storage_path);

      if (downloadError || !fileData) {
        throw new Error(`Failed to download file: ${downloadError?.message || 'no data'}`);
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());
      console.log(`[Pipeline] Downloaded ${buffer.length} bytes`);

      if (doc.file_type === 'pdf' || doc.file_name.endsWith('.pdf')) {
        console.log(`[Pipeline] Parsing PDF... (useVision: ${useVision})`);
        text = await parsePDF(buffer, { useVision });
        console.log(`[Pipeline] PDF parsed, text length: ${text.length}`);
      } else if (doc.file_type === 'html' || doc.file_name.endsWith('.html')) {
        text = buffer.toString('utf-8');
      } else if (doc.file_type === 'text') {
        text = buffer.toString('utf-8');
      } else {
        text = buffer.toString('utf-8');
      }
    } else if (doc.file_type === 'qa') {
      return { success: true, chunks: 0 };
    } else {
      throw new Error(`Unsupported file type: ${doc.file_type}`);
    }

    if (!text || text.trim().length === 0) {
      throw new Error('No text content extracted from document. The file may be a scanned image PDF.');
    }

    // Auto-classify language & doc type
    let docLanguage = doc.language as string | null;
    let docType = doc.doc_type as string | null;

    if (!docLanguage || !docType) {
      console.log('[Pipeline] Auto-classifying document...');
      const classification = await classifyDocument(text.substring(0, 2000));
      docLanguage = docLanguage || classification.language;
      docType = docType || classification.docType;
      console.log(`[Pipeline] Classified: language=${docLanguage}, docType=${docType}`);
    }

    // Apply language-specific preprocessing
    text = preprocessByLanguage(text, docLanguage);

    // Restructure table-heavy documents with AI
    if (docType === 'table_heavy' && !useVision && doc.file_type !== 'url') {
      console.log('[Pipeline] Restructuring table-heavy document with AI...');
      text = await restructureWithAI(text);
      console.log(`[Pipeline] Restructured text length: ${text.length}`);
    }

    // Determine adaptive chunking parameters
    const ragConfig = await getRagConfigForBot(botId);
    const chunkSize = ragConfig?.chunkSize || 500;
    const chunkOverlap = ragConfig?.chunkOverlap || getChunkOverlap(docLanguage, chunkSize);
    const separator = '\n\n';

    console.log(`[Pipeline] Chunking params: size=${chunkSize}, overlap=${chunkOverlap}`);

    const chunks = chunkText(text, { chunkSize, chunkOverlap, separator });

    if (chunks.length === 0) {
      throw new Error('No chunks generated from text');
    }

    // Table summarization for table-heavy documents
    let allChunks = [...chunks];
    if (docType === 'table_heavy') {
      console.log('[Pipeline] Generating table summaries...');
      const tableSummaries = await summarizeTables(text, doc.file_name);
      if (tableSummaries.length > 0) {
        console.log(`[Pipeline] Added ${tableSummaries.length} table summary chunks`);
        allChunks = [...allChunks, ...tableSummaries];
      }
    }

    // Generate embeddings in batch
    const embeddings = await generateEmbeddings(allChunks.map((c) => c.content));

    // Store chunks with embeddings
    const chunkRecords = allChunks.map((chunk, i) => ({
      document_id: documentId,
      bot_id: botId,
      content: chunk.content,
      metadata: {
        file_name: doc.file_name,
        chunk_index: chunk.metadata.chunkIndex,
      },
      embedding: JSON.stringify(embeddings[i]),
    }));

    // Insert in batches
    for (let i = 0; i < chunkRecords.length; i += PIPELINE_INSERT_BATCH_SIZE) {
      const batch = chunkRecords.slice(i, i + PIPELINE_INSERT_BATCH_SIZE);
      const { error: insertError } = await supabase
        .from('document_chunks')
        .insert(batch);

      if (insertError) {
        throw new Error(`Failed to insert chunks batch ${i}: ${insertError.message}`);
      }
    }

    // Update document status (+ page title for URL docs)
    const updateData: Record<string, unknown> = {
      status: 'completed',
      chunk_count: allChunks.length,
      language: docLanguage,
      doc_type: docType,
    };
    if (pageTitle && doc.file_type === 'url') {
      updateData.file_name = pageTitle;
    }
    await supabase
      .from('documents')
      .update(updateData)
      .eq('id', documentId);

    return { success: true, chunks: allChunks.length };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await supabase
      .from('documents')
      .update({
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', documentId);

    throw error;
  }
}

async function getRagConfigForBot(botId: string) {
  try {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from('bots')
      .select('rag_config')
      .eq('id', botId)
      .single();

    if (data?.rag_config && typeof data.rag_config === 'object') {
      const config = data.rag_config as Record<string, unknown>;
      return {
        chunkSize: (config.chunkSize as number) || undefined,
        chunkOverlap: (config.chunkOverlap as number) || undefined,
      } as ChunkStrategy;
    }
    return null;
  } catch {
    return null;
  }
}
