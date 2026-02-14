'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DocumentUploader } from '@/features/dashboard/DocumentUploader';
import { DocumentList } from '@/features/dashboard/DocumentList';
import { QAPairForm } from '@/features/dashboard/QAPairForm';

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number | null;
  status: string;
  chunk_count: number;
  created_at: string;
}

export default function DocumentsPage() {
  const params = useParams();
  const botId = params.botId as string;
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [crawlUrl, setCrawlUrl] = useState('');
  const [crawling, setCrawling] = useState(false);
  const [activeSection, setActiveSection] = useState<'upload' | 'crawl' | 'qa'>('upload');

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/owner/bots/${botId}/documents?limit=100`);
      const json = await res.json();
      if (json.success) {
        setDocuments(json.data.documents);
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  }, [botId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Poll for processing status
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === 'processing' || d.status === 'pending');
    if (!hasProcessing) return;

    const interval = setInterval(fetchDocuments, 5000);
    return () => clearInterval(interval);
  }, [documents, fetchDocuments]);

  async function handleDelete(docId: string) {
    if (!confirm('Delete this document? All associated chunks will be removed.')) return;
    setDeleting(docId);
    try {
      await fetch(`/api/owner/bots/${botId}/documents/${docId}`, { method: 'DELETE' });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(docId);
        return next;
      });
      fetchDocuments();
    } catch {
      alert('Failed to delete document');
    } finally {
      setDeleting(null);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected document(s)? All associated chunks will be removed.`)) return;

    setBulkDeleting(true);
    try {
      const res = await fetch(`/api/owner/bots/${botId}/documents/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.error || 'Failed to delete documents');
      } else {
        setSelectedIds(new Set());
      }
      fetchDocuments();
    } catch {
      alert('Failed to delete documents');
    } finally {
      setBulkDeleting(false);
    }
  }

  async function handleCrawl(e: React.FormEvent) {
    e.preventDefault();
    if (!crawlUrl.trim()) return;
    setCrawling(true);
    try {
      const res = await fetch(`/api/owner/bots/${botId}/documents/crawl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: crawlUrl.trim() }),
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.error || 'Crawl failed');
      } else {
        setCrawlUrl('');
        fetchDocuments();
      }
    } catch {
      alert('Network error');
    } finally {
      setCrawling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/dashboard/bots/${botId}`}
            className="text-sm text-blue-600 hover:underline"
          >
            &larr; Back to bot
          </Link>
          <h2 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Knowledge Base</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {documents.length} documents
          </p>
        </div>
      </div>

      {/* Add content section */}
      <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
          {(['upload', 'crawl', 'qa'] as const).map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                activeSection === section
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {section === 'upload' ? 'Upload File' : section === 'crawl' ? 'Crawl URL' : 'Add Q&A'}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {activeSection === 'upload' && (
            <DocumentUploader botId={botId} onUploaded={fetchDocuments} />
          )}

          {activeSection === 'crawl' && (
            <form onSubmit={handleCrawl} className="flex gap-3">
              <input
                type="url"
                required
                value={crawlUrl}
                onChange={(e) => setCrawlUrl(e.target.value)}
                placeholder="https://example.com/page"
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={crawling}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {crawling ? 'Crawling...' : 'Crawl'}
              </button>
            </form>
          )}

          {activeSection === 'qa' && (
            <QAPairForm botId={botId} onCreated={fetchDocuments} />
          )}
        </div>
      </div>

      {/* Document list */}
      <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Documents</h3>
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {bulkDeleting
                ? 'Deleting...'
                : `Delete Selected (${selectedIds.size})`}
            </button>
          )}
        </div>
        <div className="mt-4">
          <DocumentList
            documents={documents}
            onDelete={handleDelete}
            deleting={deleting}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        </div>
      </div>
    </div>
  );
}
