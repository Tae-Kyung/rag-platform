import { describe, it, expect } from 'vitest';
import { truncateForKakao } from '@/lib/channels/kakao/handler';

describe('truncateForKakao', () => {
  it('returns text as-is when under 1000 chars', () => {
    const text = '안녕하세요. 반갑습니다.';
    expect(truncateForKakao(text)).toBe(text);
  });

  it('returns text as-is when exactly 1000 chars', () => {
    const text = 'a'.repeat(1000);
    expect(truncateForKakao(text)).toBe(text);
  });

  it('truncates text exceeding 1000 chars', () => {
    const text = 'a'.repeat(1500);
    const result = truncateForKakao(text);
    expect(result.length).toBeLessThanOrEqual(1000);
    expect(result.endsWith('...')).toBe(true);
  });

  it('truncates at sentence boundary when possible', () => {
    // Create text with sentences, where a sentence ends near the limit
    const sentence = '이것은 테스트 문장입니다. '; // 15 chars
    const repeated = sentence.repeat(80); // 1200 chars, well over 1000
    const result = truncateForKakao(repeated);

    expect(result.length).toBeLessThanOrEqual(1000);
    expect(result.endsWith('...')).toBe(true);
    // Should end at a sentence boundary + ellipsis
    expect(result).toMatch(/다\.\.\./);
  });

  it('handles Korean text properly', () => {
    const koreanText = '카카오톡은 한국에서 가장 인기 있는 메신저입니다. '.repeat(50); // ~1400 chars
    const result = truncateForKakao(koreanText);

    expect(result.length).toBeLessThanOrEqual(1000);
    expect(result.endsWith('...')).toBe(true);
  });

  it('respects custom maxLength parameter', () => {
    const text = 'Hello world. This is a test sentence. Another one here.';
    const result = truncateForKakao(text, 30);

    expect(result.length).toBeLessThanOrEqual(30);
    expect(result.endsWith('...')).toBe(true);
  });

  it('handles text with no sentence boundaries gracefully', () => {
    const text = 'abcdefghij'.repeat(150); // 1500 chars, no spaces or periods
    const result = truncateForKakao(text);

    expect(result.length).toBeLessThanOrEqual(1000);
    expect(result.endsWith('...')).toBe(true);
  });
});
