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
      fetchDocuments();
    } catch {
      alert('Failed to delete document');
    } finally {
      setDeleting(null);
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
          <h2 className="mt-1 text-2xl font-bold text-gray-900">Knowledge Base</h2>
          <p className="mt-1 text-sm text-gray-500">
            {documents.length} documents
          </p>
        </div>
      </div>

      {/* Add content section */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex gap-2 border-b border-gray-200 pb-3">
          {(['upload', 'crawl', 'qa'] as const).map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                activeSection === section
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:bg-gray-100'
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
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
        <div className="mt-4">
          <DocumentList
            documents={documents}
            onDelete={handleDelete}
            deleting={deleting}
          />
        </div>
      </div>
    </div>
  );
}
