'use client';

import { useState, useRef } from 'react';

interface QAPairFormProps {
  botId: string;
  onCreated: () => void;
}

interface CSVRow {
  question: string;
  answer: string;
  category?: string;
}

function parseCSV(text: string): CSVRow[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  // Parse header
  const header = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
  const qIdx = header.indexOf('question');
  const aIdx = header.indexOf('answer');
  const cIdx = header.indexOf('category');

  if (qIdx === -1 || aIdx === -1) return [];

  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const question = cols[qIdx]?.trim();
    const answer = cols[aIdx]?.trim();
    if (question && answer) {
      rows.push({
        question,
        answer,
        category: cIdx !== -1 ? cols[cIdx]?.trim() : undefined,
      });
    }
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}

export function QAPairForm({ botId, onCreated }: QAPairFormProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // CSV upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CSVRow[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: number; failed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file.');
      return;
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      setError('No valid Q&A pairs found. CSV must have "question" and "answer" columns.');
      return;
    }

    setCsvFile(file);
    setCsvPreview(rows);
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
      setCsvPreview(null);
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
    setCsvPreview(null);
    setUploadResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

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

        {csvPreview && (
          <div className="mt-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {csvPreview.length} Q&A pair(s) found in <span className="font-medium">{csvFile?.name}</span>
            </p>
            <div className="max-h-40 overflow-y-auto rounded border border-gray-200 dark:border-gray-600">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                  <tr>
                    <th className="px-2 py-1 text-left text-gray-600 dark:text-gray-400">#</th>
                    <th className="px-2 py-1 text-left text-gray-600 dark:text-gray-400">Question</th>
                    <th className="px-2 py-1 text-left text-gray-600 dark:text-gray-400">Answer</th>
                    <th className="px-2 py-1 text-left text-gray-600 dark:text-gray-400">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-2 py-1 text-gray-500 dark:text-gray-400">{i + 1}</td>
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
                {uploading ? 'Uploading...' : `Upload ${csvPreview.length} Q&A pairs`}
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Question</label>
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Answer</label>
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category (optional)</label>
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
