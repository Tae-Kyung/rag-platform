'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface BotFormData {
  name: string;
  description: string;
  system_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
}

interface BotFormProps {
  mode: 'create' | 'edit';
  botId?: string;
  initialData?: Partial<BotFormData>;
}

const MODEL_OPTIONS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Affordable)' },
  { value: 'gpt-4o', label: 'GPT-4o (Most Capable)' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
];

export function BotForm({ mode, botId, initialData }: BotFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<BotFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    system_prompt: initialData?.system_prompt || '',
    model: initialData?.model || 'gpt-4o-mini',
    temperature: initialData?.temperature ?? 0.3,
    max_tokens: initialData?.max_tokens ?? 1000,
  });

  function updateField<K extends keyof BotFormData>(key: K, value: BotFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const url = mode === 'create' ? '/api/owner/bots' : `/api/owner/bots/${botId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error || 'Failed to save bot');
        return;
      }

      if (mode === 'create') {
        router.push(`/dashboard/bots/${json.data.id}`);
      } else {
        router.refresh();
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Bot Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          maxLength={100}
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="My Customer Support Bot"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
        <input
          type="text"
          maxLength={500}
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="A bot for answering customer questions"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">System Prompt</label>
        <textarea
          rows={5}
          maxLength={5000}
          value={form.system_prompt}
          onChange={(e) => updateField('system_prompt', e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="You are a helpful customer support agent..."
        />
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Optional. Defines how the bot should behave. Leave empty for a default assistant.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Model</label>
          <select
            value={form.model}
            onChange={(e) => updateField('model', e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {MODEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Temperature: {form.temperature.toFixed(1)}
          </label>
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={form.temperature}
            onChange={(e) => updateField('temperature', parseFloat(e.target.value))}
            className="mt-2 w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
            <span>Precise</span>
            <span>Creative</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Max Tokens</label>
          <input
            type="number"
            min={100}
            max={4000}
            step={100}
            value={form.max_tokens}
            onChange={(e) => updateField('max_tokens', parseInt(e.target.value) || 1000)}
            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          disabled={saving || !form.name.trim()}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : mode === 'create' ? 'Create Bot' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 dark:border-gray-600 px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
