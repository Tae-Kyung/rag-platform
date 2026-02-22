'use client';

import { useEffect, useState, useCallback } from 'react';

interface CustomModel {
  id: string;
  name: string;
  model_id: string;
  provider: string;
  base_url: string;
  api_key_env: string;
  api_key_header: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ModelForm {
  name: string;
  model_id: string;
  provider: string;
  base_url: string;
  api_key_env: string;
  api_key_header: string;
  is_active: boolean;
}

const emptyForm: ModelForm = {
  name: '',
  model_id: '',
  provider: 'Custom',
  base_url: '',
  api_key_env: '',
  api_key_header: 'x-api-key',
  is_active: true,
};

export default function AdminModelsPage() {
  const [models, setModels] = useState<CustomModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ModelForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [testResult, setTestResult] = useState<Record<string, { status: string; message: string; loading: boolean }>>({});

  const fetchModels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sys/models');
      const json = await res.json();
      if (json.success) {
        setModels(json.data.models);
      }
    } catch {
      console.error('Failed to fetch models');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  function openCreateForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    setShowForm(true);
  }

  function openEditForm(model: CustomModel) {
    setForm({
      name: model.name,
      model_id: model.model_id,
      provider: model.provider,
      base_url: model.base_url,
      api_key_env: model.api_key_env,
      api_key_header: model.api_key_header,
      is_active: model.is_active,
    });
    setEditingId(model.id);
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const url = editingId ? `/api/sys/models/${editingId}` : '/api/sys/models';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'Failed to save model');
        return;
      }

      setShowForm(false);
      fetchModels();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this model?')) return;

    try {
      const res = await fetch(`/api/sys/models/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchModels();
      }
    } catch {
      console.error('Failed to delete model');
    }
  }

  async function handleTest(id: string) {
    setTestResult((prev) => ({ ...prev, [id]: { status: 'testing', message: 'Testing...', loading: true } }));

    try {
      const res = await fetch(`/api/sys/models/${id}/test`, { method: 'POST' });
      const json = await res.json();

      if (json.success) {
        setTestResult((prev) => ({
          ...prev,
          [id]: {
            status: 'success',
            message: `Connected (${json.data.latency_ms}ms) — "${json.data.response}"`,
            loading: false,
          },
        }));
      } else {
        setTestResult((prev) => ({
          ...prev,
          [id]: { status: 'error', message: json.error, loading: false },
        }));
      }
    } catch {
      setTestResult((prev) => ({
        ...prev,
        [id]: { status: 'error', message: 'Network error', loading: false },
      }));
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Custom Models</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage custom LLM endpoints (OpenAI-compatible)
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Model
        </button>
      </div>

      {/* Model Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-gray-800 shadow-2xl">
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingId ? 'Edit Model' : 'Add New Model'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="EXAONE 3.5 7.8B Instruct"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Model ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.model_id}
                  onChange={(e) => setForm((f) => ({ ...f, model_id: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="exaone-357-8b-instruct-awq"
                />
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  The model identifier sent in API requests
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Provider</label>
                <input
                  type="text"
                  value={form.provider}
                  onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Custom"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Base URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={form.base_url}
                  onChange={(e) => setForm((f) => ({ ...f, base_url: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="http://gpu-local.example.com:9020/api/v1/model-name"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">API Key 환경변수명</label>
                  <input
                    type="text"
                    value={form.api_key_env}
                    onChange={(e) => setForm((f) => ({ ...f, api_key_env: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="EXAONE_API_KEY"
                  />
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    .env에 설정된 환경변수 이름 (실제 키는 서버 환경변수에 저장)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">API Key Header</label>
                  <input
                    type="text"
                    value={form.api_key_header}
                    onChange={(e) => setForm((f) => ({ ...f, api_key_header: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="x-api-key"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Models Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>
      ) : models.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No custom models registered yet.</p>
          <button
            onClick={openCreateForm}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add Your First Model
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Model ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Provider</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Base URL</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {models.map((model) => (
                <tr key={model.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{model.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 font-mono">{model.model_id}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{model.provider}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-[200px] truncate">{model.base_url}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      model.is_active
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {model.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleTest(model.id)}
                        disabled={testResult[model.id]?.loading}
                        className="rounded border border-gray-300 dark:border-gray-600 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        {testResult[model.id]?.loading ? 'Testing...' : 'Test'}
                      </button>
                      <button
                        onClick={() => openEditForm(model)}
                        className="rounded border border-gray-300 dark:border-gray-600 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(model.id)}
                        className="rounded border border-gray-300 dark:border-gray-600 px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                      >
                        Delete
                      </button>
                    </div>
                    {testResult[model.id] && !testResult[model.id].loading && (
                      <div className={`mt-1 text-xs ${
                        testResult[model.id].status === 'success'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {testResult[model.id].message}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
