import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create a shared mock instance so we can track calls
const mockCreate = vi.fn().mockResolvedValue({
  data: [{ embedding: [0.1, 0.2, 0.3] }],
});

const mockOpenAI = {
  embeddings: { create: mockCreate },
};

vi.mock('@/lib/openai/client', () => ({
  getOpenAI: vi.fn(() => mockOpenAI),
}));

vi.mock('@/config/constants', () => ({
  EMBEDDING_BATCH_SIZE: 2,
  EMBEDDING_MAX_INPUT_LENGTH: 8000,
}));

import { generateEmbedding, generateEmbeddings } from '@/lib/rag/embeddings';

describe('generateEmbedding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({
      data: [{ embedding: [0.1, 0.2, 0.3] }],
    });
  });

  it('returns embedding array', async () => {
    const result = await generateEmbedding('Hello world');
    expect(result).toEqual([0.1, 0.2, 0.3]);
  });

  it('calls OpenAI with text-embedding-3-small model', async () => {
    await generateEmbedding('Test text');
    expect(mockCreate).toHaveBeenCalledWith({
      model: 'text-embedding-3-small',
      input: 'Test text',
    });
  });

  it('truncates text to max input length', async () => {
    const longText = 'a'.repeat(10000);
    await generateEmbedding(longText);
    expect(mockCreate).toHaveBeenCalledWith({
      model: 'text-embedding-3-small',
      input: 'a'.repeat(8000),
    });
  });
});

describe('generateEmbeddings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockImplementation(
      async ({ input }: { input: string | string[] }) => {
        const arr = Array.isArray(input) ? input : [input];
        return { data: arr.map(() => ({ embedding: [0.1, 0.2, 0.3] })) };
      }
    );
  });

  it('returns embeddings for all texts', async () => {
    const result = await generateEmbeddings(['text1', 'text2']);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual([0.1, 0.2, 0.3]);
  });

  it('batches requests according to EMBEDDING_BATCH_SIZE', async () => {
    // BATCH_SIZE is mocked to 2, so 3 texts = 2 API calls
    await generateEmbeddings(['text1', 'text2', 'text3']);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it('handles single text input', async () => {
    const result = await generateEmbeddings(['single']);
    expect(result).toHaveLength(1);
  });

  it('handles empty array', async () => {
    const result = await generateEmbeddings([]);
    expect(result).toEqual([]);
  });

  it('truncates each text in batch to max input length', async () => {
    const longText = 'b'.repeat(10000);
    await generateEmbeddings([longText]);
    expect(mockCreate).toHaveBeenCalledWith({
      model: 'text-embedding-3-small',
      input: ['b'.repeat(8000)],
    });
  });
});
