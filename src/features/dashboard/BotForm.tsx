'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface BotFormData {
  name: string;
  description: string;
  system_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
  conversation_history_limit: number;
}

interface BotFormProps {
  mode: 'create' | 'edit';
  botId?: string;
  initialData?: Partial<BotFormData>;
}

interface EnhanceEligibility {
  eligible: boolean;
  userMessageCount: number;
  requiredCount: number;
}

interface EnhanceResult {
  enhanced_prompt: string;
  analysis: {
    topTopics: string[];
    knowledgeGaps: string[];
    toneRecommendation: string;
    pairsAnalyzed: number;
    failedCount: number;
  };
}

const MODEL_OPTIONS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Affordable)' },
  { value: 'gpt-4o', label: 'GPT-4o (Most Capable)' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
];

export function BotForm({ mode, botId, initialData }: BotFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Enhance prompt state
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceEligibility, setEnhanceEligibility] = useState<EnhanceEligibility | null>(null);
  const [enhancedPrompt, setEnhancedPrompt] = useState<EnhanceResult | null>(null);
  const [showEnhanceModal, setShowEnhanceModal] = useState(false);

  const [form, setForm] = useState<BotFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    system_prompt: initialData?.system_prompt || '',
    model: initialData?.model || 'gpt-4o-mini',
    temperature: initialData?.temperature ?? 0.3,
    max_tokens: initialData?.max_tokens ?? 1000,
    conversation_history_limit: initialData?.conversation_history_limit ?? 6,
  });

  function updateField<K extends keyof BotFormData>(key: K, value: BotFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Check enhance eligibility in edit mode
  useEffect(() => {
    if (mode !== 'edit' || !botId) return;

    async function checkEligibility() {
      try {
        const res = await fetch(`/api/owner/bots/${botId}/enhance-prompt`);
        const json = await res.json();
        if (json.success) {
          setEnhanceEligibility(json.data);
        }
      } catch {
        // Silently fail — feature is optional
      }
    }

    checkEligibility();
  }, [mode, botId]);

  async function handleEnhancePrompt() {
    if (!botId) return;
    setEnhancing(true);
    setError('');

    try {
      const res = await fetch(`/api/owner/bots/${botId}/enhance-prompt`, {
        method: 'POST',
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error || '프롬프트 개선에 실패했습니다');
        return;
      }

      setEnhancedPrompt(json.data);
      setShowEnhanceModal(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setEnhancing(false);
    }
  }

  function handleApplyEnhancedPrompt() {
    if (enhancedPrompt) {
      updateField('system_prompt', enhancedPrompt.enhanced_prompt);
      setShowEnhanceModal(false);
      setEnhancedPrompt(null);
    }
  }

  async function handleGeneratePrompt() {
    setGenerating(true);
    setError('');

    try {
      const res = await fetch('/api/owner/bots/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          contact_email: contactEmail || undefined,
          contact_phone: contactPhone || undefined,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error || 'Failed to generate prompt');
        return;
      }

      updateField('system_prompt', json.data.system_prompt);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setGenerating(false);
    }
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
    <>
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Email</label>
            <input
              type="email"
              maxLength={200}
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="support@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Phone</label>
            <input
              type="tel"
              maxLength={50}
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="02-1234-5678"
            />
          </div>
          <p className="sm:col-span-2 text-xs text-gray-400 dark:text-gray-500">
            Optional. Used only for AI prompt generation (not saved to bot).
          </p>
        </div>

        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">System Prompt</label>
            <button
              type="button"
              disabled={!form.name.trim() || generating}
              onClick={handleGeneratePrompt}
              className="rounded-md bg-purple-600 px-3 py-1 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'AI로 시스템 프롬프트 생성'}
            </button>
            {mode === 'edit' && enhanceEligibility && (
              enhanceEligibility.eligible ? (
                <button
                  type="button"
                  disabled={enhancing}
                  onClick={handleEnhancePrompt}
                  className="rounded-md bg-amber-500 px-3 py-1 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  {enhancing ? '분석 중...' : '대화 데이터로 프롬프트 개선'}
                </button>
              ) : (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  프롬프트 개선: {enhanceEligibility.userMessageCount}/{enhanceEligibility.requiredCount} 메시지
                </span>
              )
            )}
          </div>
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">대화 기록 수</label>
            <input
              type="number"
              min={1}
              max={50}
              step={1}
              value={form.conversation_history_limit}
              onChange={(e) => updateField('conversation_history_limit', parseInt(e.target.value) || 6)}
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              챗봇이 참고할 이전 대화 수 (1~50)
            </p>
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

      {/* Enhance Prompt Result Modal */}
      {showEnhanceModal && enhancedPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white dark:bg-gray-800 shadow-2xl">
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                프롬프트 개선 분석 결과
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {enhancedPrompt.analysis.pairsAnalyzed}개 Q&A 쌍 분석 완료
                {enhancedPrompt.analysis.failedCount > 0 && (
                  <> (답변 실패 {enhancedPrompt.analysis.failedCount}건 감지)</>
                )}
              </p>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Analysis Summary Cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 p-4">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                    주요 질문 주제
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {enhancedPrompt.analysis.topTopics.map((topic) => (
                      <span
                        key={topic}
                        className="rounded-full bg-blue-100 dark:bg-blue-800 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-200"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 p-4">
                  <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                    지식 부족 영역
                  </h3>
                  {enhancedPrompt.analysis.knowledgeGaps.length > 0 ? (
                    <ul className="space-y-1 text-xs text-amber-700 dark:text-amber-200">
                      {enhancedPrompt.analysis.knowledgeGaps.map((gap) => (
                        <li key={gap} className="flex items-start gap-1">
                          <span className="mt-0.5 shrink-0">&#x2022;</span>
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-amber-600 dark:text-amber-300">감지된 지식 부족 영역이 없습니다.</p>
                  )}
                </div>
              </div>

              {/* Tone Recommendation */}
              {enhancedPrompt.analysis.toneRecommendation && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    톤/스타일 제안
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {enhancedPrompt.analysis.toneRecommendation}
                  </p>
                </div>
              )}

              {/* Side-by-side Comparison */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    현재 프롬프트
                  </h3>
                  <div className="h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-3">
                    <pre className="whitespace-pre-wrap text-xs text-gray-600 dark:text-gray-400">
                      {form.system_prompt || '(설정된 프롬프트 없음)'}
                    </pre>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-2">
                    개선 제안
                  </h3>
                  <div className="h-64 overflow-y-auto rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-3">
                    <pre className="whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-300">
                      {enhancedPrompt.enhanced_prompt}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowEnhanceModal(false);
                  setEnhancedPrompt(null);
                }}
                className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleApplyEnhancedPrompt}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
              >
                적용하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
