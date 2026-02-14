import * as cheerio from 'cheerio';
import path from 'path';
import { pathToFileURL } from 'url';
import { applyDOMPolyfills } from './dommatrix-polyfill';
import { getOpenAI } from '@/lib/openai/client';
import { LLM_MODEL, VISION_MAX_TEXT_LENGTH, CRAWL_TIMEOUT_MS } from '@/config/constants';

export interface ParsePDFOptions {
  useVision?: boolean; // Use GPT-4 Vision for table-heavy PDFs
  maxPages?: number;   // Max pages to process with Vision (default: 10)
}

export async function parsePDF(buffer: Buffer, options: ParsePDFOptions = {}): Promise<string> {
  const { useVision = false, maxPages = 10 } = options;

  if (useVision) {
    return parsePDFWithVision(buffer, maxPages);
  }

  return parsePDFWithText(buffer);
}

/**
 * Parse PDF using GPT-4 for table restructuring
 * Extracts text and uses AI to format tables properly
 */
async function parsePDFWithVision(buffer: Buffer, _maxPages: number): Promise<string> {
  // First, extract raw text using standard method
  const rawText = await parsePDFWithText(buffer);

  console.log(`[Parser] Vision: Extracted ${rawText.length} chars`);

  // If text is too long, skip AI restructuring (would take too long/cost too much)
  if (rawText.length > VISION_MAX_TEXT_LENGTH) {
    console.log(`[Parser] Vision: Text too long (${rawText.length} > ${VISION_MAX_TEXT_LENGTH}), using raw text`);
    return rawText;
  }

  // Use GPT-4 to restructure the text in a single call
  console.log(`[Parser] Vision: Sending to GPT-4 for table restructuring`);

  try {
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: LLM_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert at cleaning up text extracted from PDFs.
Follow these rules:
1. If there is table data, convert it to markdown table format.
2. Identify the row-column relationships and structure them accurately.
3. Keep the original content intact, just make it more readable.
4. Output only the cleaned content without additional explanation or comments.`,
        },
        {
          role: 'user',
          content: `Please clean up the following PDF text. If there are tables, convert them to markdown tables:\n\n${rawText}`,
        },
      ],
      max_tokens: 8000,
      temperature: 0,
    });

    const processed = response.choices[0].message.content || rawText;
    console.log(`[Parser] Vision: Restructuring complete (${processed.length} chars)`);
    return processed;
  } catch (error) {
    console.error(`[Parser] Vision: GPT-4 failed, using raw text:`, error);
    return rawText; // Fallback to raw text on failure
  }
}

/**
 * Parse PDF using text extraction - fast but loses table structure
 */
async function parsePDFWithText(buffer: Buffer): Promise<string> {
  // Polyfill DOMMatrix/DOMPoint/DOMRect for serverless environments (Vercel)
  // where @napi-rs/canvas native module is unavailable
  applyDOMPolyfills();

  const { PDFParse } = await import('pdf-parse');

  // Use path.join with process.cwd() — works on Vercel with serverExternalPackages
  const workerPath = pathToFileURL(
    path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')
  ).href;
  PDFParse.setWorker(workerPath);

  const parser = new PDFParse({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  });

  const result = await parser.getText();
  await parser.destroy();

  // Remove page separator lines (e.g. "-- 1 of 5 --")
  const text = result.text.replace(/\n--\s*\d+\s+of\s+\d+\s*--\n/g, '\n');
  return cleanText(text);
}

export async function parseHTML(html: string): Promise<string> {
  const $ = cheerio.load(html);

  // Remove unwanted elements
  $('script, style, nav, footer, header, aside, .sidebar, .menu, .navigation').remove();

  // Convert HTML tables to markdown BEFORE text extraction
  $('table').each((_, table) => {
    const rows: string[][] = [];
    $(table).find('tr').each((_, tr) => {
      const cells: string[] = [];
      $(tr).find('th, td').each((_, cell) => {
        const text = $(cell).text().trim().replace(/\s+/g, ' ');
        cells.push(text);
      });
      if (cells.length > 0) {
        rows.push(cells);
      }
    });

    if (rows.length === 0) return;

    // Determine max column count
    const colCount = Math.max(...rows.map((r) => r.length));

    // Build markdown table
    const mdRows = rows.map((row) => {
      const padded = [...row];
      while (padded.length < colCount) padded.push('');
      return `| ${padded.join(' | ')} |`;
    });

    // Insert separator after first row (header)
    if (mdRows.length > 1) {
      const sep = `| ${Array(colCount).fill('---').join(' | ')} |`;
      mdRows.splice(1, 0, sep);
    }

    $(table).replaceWith(`\n\n${mdRows.join('\n')}\n\n`);
  });

  // Try to get main content
  const mainContent = $(
    'main, article, .content, .post, #content, #main, ' +
    '.page-content, .entry-content, #container'
  ).first();
  const text = mainContent.length > 0 ? mainContent.text() : $('body').text();

  return cleanText(text);
}

export interface CrawlResult {
  text: string;
  title?: string;
}

async function fetchWithRetry(url: string): Promise<Response> {
  const parsed = new URL(url);
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': `${parsed.origin}/`,
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  };

  const response = await fetch(url, {
    headers,
    redirect: 'follow',
    signal: AbortSignal.timeout(CRAWL_TIMEOUT_MS),
  });

  return response;
}

export async function crawlURL(url: string): Promise<CrawlResult> {
  const response = await fetchWithRetry(url);

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error(
        `Crawl blocked: The site (${new URL(url).hostname}) blocks server access. ` +
        `Sites with bot protection (e.g. Cloudflare) cannot be crawled.`
      );
    }
    throw new Error(`URL request failed: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/pdf')) {
    const buffer = Buffer.from(await response.arrayBuffer());
    const text = await parsePDF(buffer);
    return { text };
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const title = $('title').first().text().trim() ||
    $('meta[property="og:title"]').attr('content')?.trim() ||
    undefined;
  const text = await parseHTML(html);
  return { text, title };
}

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/ {2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
}
