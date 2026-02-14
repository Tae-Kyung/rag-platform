'use client';

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number | null;
  status: string;
  chunk_count: number;
  created_at: string;
}

interface DocumentListProps {
  documents: Document[];
  onDelete: (docId: string) => void;
  deleting: string | null;
}

function statusBadge(status: string) {
  switch (status) {
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:text-yellow-400">
          Pending
        </span>
      );
    case 'processing':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
          <span className="h-2 w-2 animate-spin rounded-full border border-blue-600 border-t-transparent" />
          Processing
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
          Completed
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
          Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
          {status}
        </span>
      );
  }
}

function formatSize(bytes: number | null) {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function DocumentList({ documents, onDelete, deleting }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
        No documents yet. Upload a file or crawl a URL to get started.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            <th className="px-3 py-3">File Name</th>
            <th className="px-3 py-3">Type</th>
            <th className="px-3 py-3">Size</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">Chunks</th>
            <th className="px-3 py-3">Date</th>
            <th className="px-3 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {documents.map((doc) => (
            <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="max-w-[200px] truncate px-3 py-3 font-medium text-gray-900 dark:text-white">
                {doc.file_name}
              </td>
              <td className="px-3 py-3 text-gray-500 dark:text-gray-400">{doc.file_type}</td>
              <td className="px-3 py-3 text-gray-500 dark:text-gray-400">{formatSize(doc.file_size)}</td>
              <td className="px-3 py-3">{statusBadge(doc.status)}</td>
              <td className="px-3 py-3 text-gray-500 dark:text-gray-400">{doc.chunk_count || '-'}</td>
              <td className="px-3 py-3 text-gray-500 dark:text-gray-400">{formatDate(doc.created_at)}</td>
              <td className="px-3 py-3">
                <button
                  onClick={() => onDelete(doc.id)}
                  disabled={deleting === doc.id}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                >
                  {deleting === doc.id ? '...' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
