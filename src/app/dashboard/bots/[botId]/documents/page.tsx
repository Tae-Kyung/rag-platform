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
  source_url: string | null;
  storage_path: string | null;
  status: string;
  chunk_count: number;
  created_at: string;
}

interface QAEditData {
  qaId: string;
  question: string;
  answer: string;
  category: string;
}

interface TypeCounts {
  all: number;
  file: number;
  url: number;
  qa: number;
  text: number;
}

type FilterType = 'all' | 'file' | 'url' | 'qa' | 'text';

const ITEMS_PER_PAGE = 20;

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
  const [crawlPreview, setCrawlPreview] = useState<{ url: string; title: string; text: string; wordCount: number } | null>(null);
  const [savingCrawl, setSavingCrawl] = useState(false);
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  const [pasting, setPasting] = useState(false);
  const [activeSection, setActiveSection] = useState<'upload' | 'crawl' | 'qa' | 'text'>('upload');

  // Pagination & filter state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [counts, setCounts] = useState<TypeCounts>({ all: 0, file: 0, url: 0, qa: 0, text: 0 });

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'single'; docId: string; name: string } | { type: 'bulk'; count: number } | null>(null);

  // QA edit modal state
  const [qaEdit, setQaEdit] = useState<QAEditData | null>(null);
  const [qaEditLoading, setQaEditLoading] = useState(false);
  const [qaEditSaving, setQaEditSaving] = useState(false);

  const fetchDocuments = useCallback(async (page?: number, type?: FilterType) => {
    const p = page ?? currentPage;
    const t = type ?? filterType;
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: String(ITEMS_PER_PAGE),
      });
      if (t !== 'all') params.set('type', t);

      const res = await fetch(`/api/owner/bots/${botId}/documents?${params}`);
      const json = await res.json();
      if (json.success) {
        setDocuments(json.data.documents);
        setTotal(json.data.total);
        setTotalPages(json.data.totalPages);
        if (json.data.counts) {
          setCounts(json.data.counts);
        }
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  }, [botId, currentPage, filterType]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Poll for processing status
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === 'processing' || d.status === 'pending');
    if (!hasProcessing) return;

    const interval = setInterval(() => fetchDocuments(), 5000);
    return () => clearInterval(interval);
  }, [documents, fetchDocuments]);

  function handleFilterChange(type: FilterType) {
    setFilterType(type);
    setCurrentPage(1);
    setSelectedIds(new Set());
    setLoading(true);
    fetchDocuments(1, type);
  }

  function handlePageChange(page: number) {
    setCurrentPage(page);
    setSelectedIds(new Set());
    setLoading(true);
    fetchDocuments(page);
  }

  function handleDeleteRequest(docId: string) {
    const doc = documents.find((d) => d.id === docId);
    setDeleteConfirm({ type: 'single', docId, name: doc?.file_name || 'this document' });
  }

  function handleBulkDeleteRequest() {
    if (selectedIds.size === 0) return;
    setDeleteConfirm({ type: 'bulk', count: selectedIds.size });
  }

  async function confirmDelete() {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'single') {
      const { docId } = deleteConfirm;
      setDeleteConfirm(null);
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
    } else {
      setDeleteConfirm(null);
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
  }

  async function handleCrawl(e: React.FormEvent) {
    e.preventDefault();
    if (!crawlUrl.trim()) return;
    setCrawling(true);
    try {
      const res = await fetch(`/api/owner/bots/${botId}/documents/crawl/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: crawlUrl.trim() }),
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.error || 'Crawl failed');
      } else {
        setCrawlPreview(json.data);
      }
    } catch {
      alert('Network error');
    } finally {
      setCrawling(false);
    }
  }

  async function handleSaveCrawl() {
    if (!crawlPreview) return;
    setSavingCrawl(true);
    try {
      const res = await fetch(`/api/owner/bots/${botId}/documents/crawl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: crawlPreview.url,
          text: crawlPreview.text,
          title: crawlPreview.title,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.error || 'Failed to save');
      } else {
        setCrawlPreview(null);
        setCrawlUrl('');
        fetchDocuments();
      }
    } catch {
      alert('Network error');
    } finally {
      setSavingCrawl(false);
    }
  }

  async function handlePasteText(e: React.FormEvent) {
    e.preventDefault();
    if (!pasteTitle.trim() || !pasteContent.trim()) return;
    setPasting(true);
    try {
      const res = await fetch(`/api/owner/bots/${botId}/documents/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: pasteTitle.trim(), content: pasteContent.trim() }),
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.error || 'Failed to add text');
      } else {
        setPasteTitle('');
        setPasteContent('');
        fetchDocuments();
      }
    } catch {
      alert('Network error');
    } finally {
      setPasting(false);
    }
  }

  async function handleEditQA(docId: string) {
    setQaEditLoading(true);
    try {
      const res = await fetch(`/api/owner/bots/${botId}/qa?document_id=${docId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setQaEdit({
          qaId: json.data.id,
          question: json.data.question,
          answer: json.data.answer,
          category: json.data.category || '',
        });
      } else {
        alert('Could not load Q&A data');
      }
    } catch {
      alert('Failed to load Q&A');
    } finally {
      setQaEditLoading(false);
    }
  }

  async function handleSaveQA() {
    if (!qaEdit) return;
    setQaEditSaving(true);
    try {
      const res = await fetch(`/api/owner/bots/${botId}/qa/${qaEdit.qaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: qaEdit.question,
          answer: qaEdit.answer,
          category: qaEdit.category,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setQaEdit(null);
        fetchDocuments();
      } else {
        alert(json.error || 'Failed to save');
      }
    } catch {
      alert('Failed to save Q&A');
    } finally {
      setQaEditSaving(false);
    }
  }

  const filterTabs: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'file', label: 'File', count: counts.file },
    { key: 'url', label: 'URL', count: counts.url },
    { key: 'qa', label: 'Q&A', count: counts.qa },
    { key: 'text', label: 'Text', count: counts.text },
  ];

  if (loading && documents.length === 0) {
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
            {counts.all} documents
          </p>
        </div>
      </div>

      {/* Add content section */}
      <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
          {(['upload', 'crawl', 'qa', 'text'] as const).map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                activeSection === section
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {section === 'upload' ? 'Upload File' : section === 'crawl' ? 'Crawl URL' : section === 'qa' ? 'Add Q&A' : 'Paste Text'}
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

          {activeSection === 'text' && (
            <form onSubmit={handlePasteText} className="space-y-3">
              <input
                type="text"
                required
                value={pasteTitle}
                onChange={(e) => setPasteTitle(e.target.value)}
                placeholder="Document title"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <textarea
                required
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="Paste your text content here..."
                rows={8}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={pasting}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {pasting ? 'Adding...' : 'Add Text'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Document list */}
      <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Documents</h3>
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDeleteRequest}
              disabled={bulkDeleting}
              className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {bulkDeleting
                ? 'Deleting...'
                : `Delete Selected (${selectedIds.size})`}
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="mt-3 flex gap-1 border-b border-gray-200 dark:border-gray-700">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleFilterChange(tab.key)}
              className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                filterType === tab.key
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-medium ${
                  filterType === tab.key
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {tab.count}
              </span>
              {filterType === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <DocumentList
            documents={documents}
            onDelete={handleDeleteRequest}
            deleting={deleting}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onEditQA={handleEditQA}
            botId={botId}
          />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <PageNumbers
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteConfirm(null)}>
          <div
            className="mx-4 w-full max-w-sm rounded-xl bg-white dark:bg-gray-800 shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirm Delete</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {deleteConfirm.type === 'single'
                ? <>Are you sure you want to delete <span className="font-medium text-gray-900 dark:text-white">{deleteConfirm.name}</span>? All associated chunks will be removed.</>
                : <>Are you sure you want to delete <span className="font-medium text-gray-900 dark:text-white">{deleteConfirm.count} documents</span>? All associated chunks will be removed.</>
              }
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Crawl Preview Modal */}
      {crawlPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => !savingCrawl && setCrawlPreview(null)}>
          <div
            className="mx-4 w-full max-w-2xl rounded-xl bg-white dark:bg-gray-800 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Crawl Preview</h3>
              <div className="mt-4 space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Title: </span>
                  <span className="text-sm text-gray-900 dark:text-white">{crawlPreview.title || '(No title)'}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">URL: </span>
                  <span className="text-sm text-blue-600 dark:text-blue-400 break-all">{crawlPreview.url}</span>
                </div>
                <div className="flex gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Words: </span>
                    <span className="text-sm text-gray-900 dark:text-white">{crawlPreview.wordCount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Characters: </span>
                    <span className="text-sm text-gray-900 dark:text-white">{crawlPreview.text.length.toLocaleString()}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
                  <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-3">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-sans">{crawlPreview.text}</pre>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setCrawlPreview(null)}
                  disabled={savingCrawl}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCrawl}
                  disabled={savingCrawl}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingCrawl ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QA Edit Modal */}
      {(qaEdit || qaEditLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => !qaEditSaving && setQaEdit(null)}>
          <div
            className="mx-4 w-full max-w-lg rounded-xl bg-white dark:bg-gray-800 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {qaEditLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : qaEdit ? (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Q&A</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Question
                    </label>
                    <input
                      type="text"
                      value={qaEdit.question}
                      onChange={(e) => setQaEdit({ ...qaEdit, question: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Answer
                    </label>
                    <textarea
                      value={qaEdit.answer}
                      onChange={(e) => setQaEdit({ ...qaEdit, answer: e.target.value })}
                      rows={6}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={qaEdit.category}
                      onChange={(e) => setQaEdit({ ...qaEdit, category: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setQaEdit(null)}
                    disabled={qaEditSaving}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveQA}
                    disabled={qaEditSaving || !qaEdit.question.trim() || !qaEdit.answer.trim()}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {qaEditSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function PageNumbers({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages: (number | 'ellipsis')[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('ellipsis');

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (currentPage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
  }

  return (
    <>
      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e${i}`} className="px-1 text-gray-400 dark:text-gray-500">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`min-w-[32px] rounded-lg px-2 py-1.5 text-sm font-medium ${
              currentPage === p
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {p}
          </button>
        )
      )}
    </>
  );
}
