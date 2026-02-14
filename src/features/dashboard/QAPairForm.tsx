'use client';

import { useState, useRef, useMemo } from 'react';

interface QAPairFormProps {
  botId: string;
  onCreated: () => void;
}

interface CSVRow {
  question: string;
  answer: string;
  category?: string;
}

interface ParsedCSV {
  headers: string[];
  rows: string[][];
}

// --- RFC 4180 compliant CSV parser ---

function stripBOM(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function detectDelimiter(firstLine: string): string {
  // Count occurrences of common delimiters in the first line
  const candidates = [',', ';', '\t'] as const;
  let best = ',';
  let bestCount = 0;
  for (const d of candidates) {
    const count = firstLine.split(d).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = d;
    }
  }
  return best;
}

/**
 * RFC 4180 compliant CSV parser.
 * Handles: multiline quoted fields, escaped quotes (""), BOM, auto delimiter.
 */
function parseCSVFull(raw: string): ParsedCSV {
  const text = stripBOM(raw);
  if (!text.trim()) return { headers: [], rows: [] };

  // Detect delimiter from first logical line
  const firstLineEnd = text.indexOf('\n');
  const firstLine = firstLineEnd === -1 ? text : text.substring(0, firstLineEnd);
  const delimiter = detectDelimiter(firstLine);

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // End of quoted field
          inQuotes = false;
          i++;
        }
      } else {
        // Any character inside quotes (including newlines)
        current += char;
        i++;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
      } else if (char === delimiter) {
        currentRow.push(current);
        current = '';
        i++;
      } else if (char === '\r') {
        // Handle \r\n or lone \r
        currentRow.push(current);
        current = '';
        if (currentRow.some((c) => c.trim())) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
        if (i < text.length && text[i] === '\n') i++;
      } else if (char === '\n') {
        currentRow.push(current);
        current = '';
        if (currentRow.some((c) => c.trim())) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
      } else {
        current += char;
        i++;
      }
    }
  }

  // Last field / row
  currentRow.push(current);
  if (currentRow.some((c) => c.trim())) {
    rows.push(currentRow);
  }

  if (rows.length === 0) return { headers: [], rows: [] };

  const headers = rows[0].map((h) => h.trim());
  return { headers, rows: rows.slice(1) };
}

// --- Column auto-mapping ---

type MappingField = 'question' | 'answer' | 'category';

const COLUMN_ALIASES: Record<MappingField, string[]> = {
  question: ['question', 'q', '질문', '문의', 'faq', 'query', '질의'],
  answer: ['answer', 'a', '답변', '답', '응답', 'response', 'reply'],
  category: ['category', '카테고리', '분류', '유형', 'type', 'tag', 'topic', '태그', '주제'],
};

function autoMapColumns(headers: string[]): Record<MappingField, number> {
  const normalized = headers.map((h) => h.trim().toLowerCase());
  const mapping: Record<MappingField, number> = { question: -1, answer: -1, category: -1 };

  for (const field of Object.keys(COLUMN_ALIASES) as MappingField[]) {
    for (const alias of COLUMN_ALIASES[field]) {
      const idx = normalized.indexOf(alias);
      if (idx !== -1) {
        mapping[field] = idx;
        break;
      }
    }
  }

  return mapping;
}

function applyMapping(
  parsed: ParsedCSV,
  mapping: Record<MappingField, number>
): CSVRow[] {
  if (mapping.question === -1 || mapping.answer === -1) return [];

  const rows: CSVRow[] = [];
  for (const cols of parsed.rows) {
    const question = cols[mapping.question]?.trim();
    const answer = cols[mapping.answer]?.trim();
    if (question && answer) {
      rows.push({
        question,
        answer,
        category:
          mapping.category !== -1 ? cols[mapping.category]?.trim() || undefined : undefined,
      });
    }
  }
  return rows;
}

// --- Component ---

export function QAPairForm({ botId, onCreated }: QAPairFormProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // CSV upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedCSV, setParsedCSV] = useState<ParsedCSV | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<MappingField, number>>({
    question: -1,
    answer: -1,
    category: -1,
  });
  const [needsManualMapping, setNeedsManualMapping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: number;
    failed: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive preview rows from parsed CSV + mapping
  const csvPreview = useMemo(() => {
    if (!parsedCSV) return null;
    return applyMapping(parsedCSV, columnMapping);
  }, [parsedCSV, columnMapping]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;

    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/owner/bots/${botId}/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          answer: answer.trim(),
          category: category.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error || 'Failed to create Q&A');
        return;
      }

      setQuestion('');
      setAnswer('');
      setCategory('');
      onCreated();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCSVSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploadResult(null);
    setNeedsManualMapping(false);

    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file.');
      return;
    }

    // Read file with encoding detection
    let text: string;
    try {
      // Try UTF-8 first
      text = await file.text();
      // If garbled Korean detected, retry with EUC-KR (CP949)
      if (/\ufffd/.test(text)) {
        const buf = await file.arrayBuffer();
        const decoder = new TextDecoder('euc-kr');
        text = decoder.decode(buf);
      }
    } catch {
      text = await file.text();
    }

    const parsed = parseCSVFull(text);

    if (parsed.headers.length === 0 || parsed.rows.length === 0) {
      setError('No data found in the CSV file.');
      return;
    }

    const mapping = autoMapColumns(parsed.headers);

    setCsvFile(file);
    setParsedCSV(parsed);
    setColumnMapping(mapping);

    // If question or answer not auto-mapped, show manual mapping UI
    if (mapping.question === -1 || mapping.answer === -1) {
      setNeedsManualMapping(true);
    }
  }

  function handleMappingChange(field: MappingField, value: number) {
    setColumnMapping((prev) => ({ ...prev, [field]: value }));
  }

  function handleMappingConfirm() {
    if (columnMapping.question === -1 || columnMapping.answer === -1) {
      setError('Please map both Question and Answer columns.');
      return;
    }
    setError('');
    setNeedsManualMapping(false);
  }

  async function handleCSVUpload() {
    if (!csvPreview || csvPreview.length === 0) return;

    setUploading(true);
    setError('');
    setUploadResult(null);

    try {
      const res = await fetch(`/api/owner/bots/${botId}/qa/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: csvPreview }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error || 'Failed to upload Q&A pairs');
        return;
      }

      setUploadResult({ success: json.data.success, failed: json.data.failed });
      setCsvFile(null);
      setParsedCSV(null);
      setNeedsManualMapping(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onCreated();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  function handleCancelCSV() {
    setCsvFile(null);
    setParsedCSV(null);
    setNeedsManualMapping(false);
    setUploadResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // Check if mapping is ready and preview has data
  const mappingReady =
    !needsManualMapping && csvPreview !== null && csvPreview.length > 0;

  return (
    <div className="space-y-6">
      {/* CSV Upload Section */}
      <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Bulk Upload via CSV
          </h4>
          <a
            href="/templates/qa_template.csv"
            download="qa_template.csv"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Download Template
          </a>
        </div>

        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleCSVSelect}
            className="block w-full text-sm text-gray-500 dark:text-gray-400
              file:mr-3 file:rounded-lg file:border-0
              file:bg-blue-50 file:dark:bg-blue-900/30
              file:px-3 file:py-1.5 file:text-sm file:font-medium
              file:text-blue-700 file:dark:text-blue-400
              hover:file:bg-blue-100 hover:file:dark:bg-blue-900/50
              file:cursor-pointer"
          />
        </div>

        {/* Excel → CSV guide */}
        <details className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
            How to convert Excel to CSV
          </summary>
          <div className="mt-2 space-y-1.5 pl-3 border-l-2 border-gray-200 dark:border-gray-600">
            <p><span className="font-medium text-gray-700 dark:text-gray-300">Excel &rarr; CSV:</span> File &rarr; Save As &rarr; <span className="font-medium">CSV UTF-8 (Comma delimited)</span></p>
            <p><span className="font-medium text-gray-700 dark:text-gray-300">Google Sheets:</span> File &rarr; Download &rarr; Comma Separated Values (.csv)</p>
            <p className="pt-1 font-medium text-gray-700 dark:text-gray-300">Tips:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Column names like <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">question</code>, <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">answer</code> or <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{'\uC9C8\uBB38'}</code>, <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{'\uB2F5\uBCC0'}</code> are auto-detected</li>
              <li>Multi-line answers are supported &mdash; Excel wraps them in quotes automatically</li>
              <li>Save as <span className="font-medium">UTF-8</span> to avoid Korean character issues</li>
              <li>If columns aren&apos;t recognized, you can map them manually</li>
            </ul>
          </div>
        </details>

        {/* Column Mapping UI */}
        {needsManualMapping && parsedCSV && (
          <div className="mt-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-3">
              Could not auto-detect columns. Please map your CSV columns:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['question', 'answer', 'category'] as MappingField[]).map((field) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {field === 'question'
                      ? 'Question *'
                      : field === 'answer'
                        ? 'Answer *'
                        : 'Category'}
                  </label>
                  <select
                    value={columnMapping[field]}
                    onChange={(e) => handleMappingChange(field, parseInt(e.target.value, 10))}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={-1}>-- Select --</option>
                    {parsedCSV.headers.map((h, idx) => (
                      <option key={idx} value={idx}>
                        {h || `Column ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            {/* Raw preview */}
            <div className="mt-3 max-h-28 overflow-y-auto rounded border border-gray-200 dark:border-gray-600">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                  <tr>
                    {parsedCSV.headers.map((h, i) => (
                      <th key={i} className="px-2 py-1 text-left text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {h || `Col ${i + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedCSV.rows.slice(0, 3).map((row, ri) => (
                    <tr key={ri} className="border-t border-gray-100 dark:border-gray-700">
                      {parsedCSV.headers.map((_, ci) => (
                        <td key={ci} className="px-2 py-1 text-gray-900 dark:text-gray-200 max-w-[150px] truncate">
                          {row[ci] || ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleMappingConfirm}
                className="rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
              >
                Apply Mapping
              </button>
              <button
                onClick={handleCancelCSV}
                className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Mapped preview */}
        {mappingReady && csvPreview && (
          <div className="mt-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {csvPreview.length} Q&A pair(s) found in{' '}
              <span className="font-medium">{csvFile?.name}</span>
            </p>
            <div className="max-h-40 overflow-y-auto rounded border border-gray-200 dark:border-gray-600">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                  <tr>
                    <th className="px-2 py-1 text-left text-gray-600 dark:text-gray-400">#</th>
                    <th className="px-2 py-1 text-left text-gray-600 dark:text-gray-400">
                      Question
                    </th>
                    <th className="px-2 py-1 text-left text-gray-600 dark:text-gray-400">
                      Answer
                    </th>
                    <th className="px-2 py-1 text-left text-gray-600 dark:text-gray-400">
                      Category
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.slice(0, 10).map((row, i) => (
                    <tr
                      key={i}
                      className="border-t border-gray-100 dark:border-gray-700"
                    >
                      <td className="px-2 py-1 text-gray-500 dark:text-gray-400">
                        {i + 1}
                      </td>
                      <td className="px-2 py-1 text-gray-900 dark:text-gray-200 max-w-[200px] truncate">
                        {row.question}
                      </td>
                      <td className="px-2 py-1 text-gray-900 dark:text-gray-200 max-w-[200px] truncate">
                        {row.answer}
                      </td>
                      <td className="px-2 py-1 text-gray-500 dark:text-gray-400">
                        {row.category || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {csvPreview.length > 10 && (
                <p className="px-2 py-1 text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800">
                  ... and {csvPreview.length - 10} more
                </p>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleCSVUpload}
                disabled={uploading}
                className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading
                  ? 'Uploading...'
                  : `Upload ${csvPreview.length} Q&A pairs`}
              </button>
              <button
                onClick={handleCancelCSV}
                disabled={uploading}
                className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Mapped but no valid rows */}
        {!needsManualMapping && parsedCSV && csvPreview && csvPreview.length === 0 && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            No valid Q&A pairs found with current column mapping. Please check your CSV.
          </p>
        )}

        {uploadResult && (
          <p className="mt-2 text-sm text-green-600 dark:text-green-400">
            {uploadResult.success} Q&A pair(s) uploaded successfully.
            {uploadResult.failed > 0 && ` ${uploadResult.failed} failed.`}
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white dark:bg-gray-900 px-2 text-gray-400 dark:text-gray-500">
            or add manually
          </span>
        </div>
      </div>

      {/* Manual form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Question
          </label>
          <textarea
            rows={2}
            required
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="What is your return policy?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Answer
          </label>
          <textarea
            rows={4}
            required
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Our return policy allows returns within 30 days..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Category (optional)
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g., Shipping, Returns, General"
          />
        </div>

        <button
          type="submit"
          disabled={saving || !question.trim() || !answer.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Adding...' : 'Add Q&A'}
        </button>
      </form>
    </div>
  );
}
