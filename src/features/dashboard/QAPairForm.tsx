'use client';

import { useState } from 'react';

interface QAPairFormProps {
  botId: string;
  onCreated: () => void;
}

export function QAPairForm({ botId, onCreated }: QAPairFormProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Question</label>
        <textarea
          rows={2}
          required
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="What is your return policy?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Answer</label>
        <textarea
          rows={4}
          required
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Our return policy allows returns within 30 days..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Category (optional)</label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
  );
}
