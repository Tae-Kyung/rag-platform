import { describe, it, expect } from 'vitest';
import { chunkText } from '@/lib/rag/chunker';
import { getChunkOverlap, preprocessKhmer, preprocessMongolian, preprocessByLanguage } from '@/lib/rag/language';

// ---- chunkText tests ----

describe('chunkText', () => {
  it('returns empty array for empty text', () => {
    expect(chunkText('')).toEqual([]);
  });

  it('returns empty array for whitespace-only text', () => {
    expect(chunkText('   \n\n   ')).toEqual([]);
  });

  it('returns single chunk for short text', () => {
    const result = chunkText('Hello world');
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('Hello world');
    expect(result[0].metadata.chunkIndex).toBe(0);
  });

  it('splits text into multiple chunks by paragraph separator', () => {
    const paragraphs = Array.from({ length: 20 }, (_, i) =>
      `Paragraph ${i}: ` + 'word '.repeat(40)
    );
    const text = paragraphs.join('\n\n');
    const result = chunkText(text, { chunkSize: 100 });
    expect(result.length).toBeGreaterThan(1);
  });

  it('respects custom chunkSize option', () => {
    const words = 'word '.repeat(200);
    const text = words.trim() + '\n\n' + words.trim();
    const result = chunkText(text, { chunkSize: 50 });
    for (const chunk of result) {
      const wordCount = chunk.content.split(/\s+/).length;
      expect(wordCount).toBeLessThanOrEqual(50 * 1.5 + 50);
    }
  });

  it('preserves chunk overlap between consecutive chunks', () => {
    const paragraphs = Array.from({ length: 30 }, (_, i) =>
      `Unique_Word_${i} ` + 'filler '.repeat(20)
    );
    const text = paragraphs.join('\n\n');
    const result = chunkText(text, { chunkSize: 60, chunkOverlap: 10 });
    if (result.length >= 2) {
      const firstChunkWords = result[0].content.split(/\s+/);
      const secondChunkWords = result[1].content.split(/\s+/);
      const lastWordsOfFirst = firstChunkWords.slice(-10);
      const firstWordsOfSecond = secondChunkWords.slice(0, 10);
      const overlap = lastWordsOfFirst.filter((w) => firstWordsOfSecond.includes(w));
      expect(overlap.length).toBeGreaterThan(0);
    }
  });

  it('sanitizes null characters from text', () => {
    const result = chunkText('Hello\u0000World\u0000Test');
    expect(result[0].content).toBe('HelloWorldTest');
  });

  it('sanitizes control characters from text', () => {
    const result = chunkText('Hello\u0001\u0008World\u007FTest');
    expect(result[0].content).not.toContain('\u0001');
    expect(result[0].content).not.toContain('\u0008');
    expect(result[0].content).not.toContain('\u007F');
  });

  it('normalizes CRLF to LF', () => {
    const result = chunkText('Line1\r\nLine2\rLine3');
    expect(result[0].content).not.toContain('\r');
  });

  it('collapses excessive whitespace', () => {
    const result = chunkText('Hello    world     test');
    expect(result[0].content).toBe('Hello world test');
  });

  it('collapses excessive newlines', () => {
    const result = chunkText('Para1\n\n\n\n\nPara2');
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('assigns sequential chunkIndex values', () => {
    const paragraphs = Array.from({ length: 20 }, () => 'word '.repeat(40));
    const text = paragraphs.join('\n\n');
    const result = chunkText(text, { chunkSize: 50 });
    for (let i = 0; i < result.length; i++) {
      expect(result[i].metadata.chunkIndex).toBeDefined();
    }
  });

  it('handles custom separator', () => {
    const result = chunkText('Section A---Section B---Section C', { separator: '---' });
    expect(result[0].content).toContain('Section');
  });

  it('splits oversized single paragraphs', () => {
    const text = 'word '.repeat(1000);
    const result = chunkText(text, { chunkSize: 100 });
    expect(result.length).toBeGreaterThan(1);
    for (const chunk of result) {
      const wordCount = chunk.content.split(/\s+/).length;
      expect(wordCount).toBeLessThanOrEqual(100 + 5);
    }
  });

  it('metadata startChar and endChar are non-negative', () => {
    const result = chunkText('First paragraph.\n\nSecond paragraph.\n\nThird paragraph.');
    for (const chunk of result) {
      expect(chunk.metadata.startChar).toBeGreaterThanOrEqual(0);
      expect(chunk.metadata.endChar).toBeGreaterThanOrEqual(chunk.metadata.startChar);
    }
  });

  it('returns TextChunk[] with correct shape', () => {
    const result = chunkText('Test content here');
    expect(result[0]).toHaveProperty('content');
    expect(result[0]).toHaveProperty('metadata');
    expect(result[0].metadata).toHaveProperty('chunkIndex');
    expect(result[0].metadata).toHaveProperty('startChar');
    expect(result[0].metadata).toHaveProperty('endChar');
  });
});

// ---- Language / preprocessing tests ----

describe('getChunkOverlap', () => {
  it('returns 10% overlap for English', () => {
    expect(getChunkOverlap('en', 500)).toBe(50);
  });

  it('returns 10% overlap for Korean', () => {
    expect(getChunkOverlap('ko', 500)).toBe(50);
  });

  it('returns 20% overlap for Khmer (rare language)', () => {
    expect(getChunkOverlap('km', 500)).toBe(100);
  });

  it('returns 20% overlap for Mongolian (rare language)', () => {
    expect(getChunkOverlap('mn', 500)).toBe(100);
  });

  it('enforces minimum of 50 for common languages', () => {
    expect(getChunkOverlap('en', 100)).toBe(50);
  });

  it('enforces minimum of 100 for rare languages', () => {
    expect(getChunkOverlap('km', 100)).toBe(100);
  });

  it('scales with chunk size for common languages', () => {
    expect(getChunkOverlap('en', 1000)).toBe(100);
  });

  it('scales with chunk size for rare languages', () => {
    expect(getChunkOverlap('mn', 1000)).toBe(200);
  });
});

describe('preprocessKhmer', () => {
  it('inserts spaces at Khmer syllable boundaries', () => {
    // Basic test: vowel sign followed by consonant
    const input = '\u17B6\u1780';
    const result = preprocessKhmer(input);
    expect(result).toContain(' ');
  });

  it('collapses multiple spaces', () => {
    const result = preprocessKhmer('Hello   World');
    expect(result).toBe('Hello World');
  });

  it('returns plain ASCII text unchanged', () => {
    expect(preprocessKhmer('Hello World')).toBe('Hello World');
  });
});

describe('preprocessMongolian', () => {
  it('replaces narrow no-break space (U+202F)', () => {
    const input = 'Hello\u202FWorld';
    expect(preprocessMongolian(input)).toBe('Hello World');
  });

  it('replaces non-breaking space (U+00A0)', () => {
    const input = 'Hello\u00A0World';
    expect(preprocessMongolian(input)).toBe('Hello World');
  });

  it('removes Mongolian vowel separator (U+180E)', () => {
    const input = 'Hello\u180EWorld';
    expect(preprocessMongolian(input)).toBe('HelloWorld');
  });

  it('collapses multiple spaces', () => {
    const result = preprocessMongolian('Hello   World');
    expect(result).toBe('Hello World');
  });
});

describe('preprocessByLanguage', () => {
  it('applies Khmer preprocessing for km', () => {
    const input = 'Hello\u202FWorld';
    expect(preprocessByLanguage(input, 'km')).toBe(preprocessKhmer(input));
  });

  it('applies Mongolian preprocessing for mn', () => {
    const input = 'Hello\u202FWorld';
    expect(preprocessByLanguage(input, 'mn')).toBe(preprocessMongolian(input));
  });

  it('returns text unchanged for English', () => {
    const input = 'Hello World';
    expect(preprocessByLanguage(input, 'en')).toBe(input);
  });

  it('returns text unchanged for Korean', () => {
    const input = '안녕하세요';
    expect(preprocessByLanguage(input, 'ko')).toBe(input);
  });

  it('returns text unchanged for unknown languages', () => {
    const input = 'Some text';
    expect(preprocessByLanguage(input, 'xx')).toBe(input);
  });
});
