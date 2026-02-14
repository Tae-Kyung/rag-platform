import { describe, it, expect } from 'vitest';
import { successResponse, errorResponse } from '@/lib/api/response';

describe('successResponse', () => {
  it('returns JSON with success: true and data', async () => {
    const res = successResponse({ items: [1, 2, 3] });
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ items: [1, 2, 3] });
  });

  it('defaults to status 200', () => {
    const res = successResponse('ok');
    expect(res.status).toBe(200);
  });

  it('supports custom status code', () => {
    const res = successResponse(null, 201);
    expect(res.status).toBe(201);
  });

  it('handles null data', async () => {
    const res = successResponse(null);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeNull();
  });

  it('handles string data', async () => {
    const res = successResponse('hello');
    const body = await res.json();
    expect(body.data).toBe('hello');
  });

  it('handles array data', async () => {
    const res = successResponse([1, 2, 3]);
    const body = await res.json();
    expect(body.data).toEqual([1, 2, 3]);
  });
});

describe('errorResponse', () => {
  it('returns JSON with success: false and error message', async () => {
    const res = errorResponse('Something went wrong');
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Something went wrong');
  });

  it('defaults to status 400', () => {
    const res = errorResponse('Bad request');
    expect(res.status).toBe(400);
  });

  it('supports custom status code', () => {
    const res = errorResponse('Not found', 404);
    expect(res.status).toBe(404);
  });

  it('supports 500 status code', () => {
    const res = errorResponse('Server error', 500);
    expect(res.status).toBe(500);
  });

  it('supports 401 status code', () => {
    const res = errorResponse('Unauthorized', 401);
    expect(res.status).toBe(401);
  });

  it('supports 403 status code', () => {
    const res = errorResponse('Forbidden', 403);
    expect(res.status).toBe(403);
  });
});
