import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseRetryAfter, probePdf } from './pdf';
import { problemPdfUrl } from './problems.api';

const answer = (status: number, headers: Record<string, string> = {}) =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status, headers })));
const PDF = { 'Content-Type': 'application/pdf' };
afterEach(() => vi.unstubAllGlobals());

describe('parseRetryAfter', () => {
  it('reads whole seconds and keeps them between the 3 s pacing floor and the cap', () => {
    expect(parseRetryAfter('4')).toBe(4000);
    expect(parseRetryAfter('1')).toBe(3000);
    expect(parseRetryAfter('0')).toBe(3000);
    expect(parseRetryAfter('999')).toBe(10_000);
    expect(parseRetryAfter('999', 300_000)).toBe(300_000);
  });
  it('falls back to 3 s when absent, malformed or a date', () => {
    expect(parseRetryAfter(null)).toBe(3000);
    expect(parseRetryAfter('soon')).toBe(3000);
    expect(parseRetryAfter('Wed, 21 Oct 2026 07:28:00 GMT')).toBe(3000);
  });
});
describe('probePdf', () => {
  it('is ready on 200 with a PDF body', async () => {
    answer(200, PDF);
    expect(await probePdf('duongdi', 'vi')).toEqual({ state: 'ready' });
  });
  it('treats a 200 that is not a PDF, such as an HTML fallback page, as a generic failure', async () => {
    answer(200, { 'Content-Type': 'text/html; charset=utf-8' });
    await expect(probePdf('duongdi', 'vi')).rejects.toMatchObject({ code: 'generic' });
    answer(200);
    await expect(probePdf('duongdi', 'vi')).rejects.toMatchObject({ code: 'generic' });
  });
  it('is rendering on 202 and tells when to ask again', async () => {
    answer(202, { 'Retry-After': '3' });
    expect(await probePdf('duongdi', 'vi')).toEqual({ state: 'rendering', retryAfterMs: 3000 });
  });
  it('is unavailable on 503 pdf_unavailable and on 429 rate_limited, with the wait the server asked for', async () => {
    answer(503, { 'Retry-After': '30' });
    expect(await probePdf('duongdi', 'vi')).toEqual({
      state: 'unavailable',
      reason: 'pdf_unavailable',
      retryAfterMs: 30_000,
    });
    answer(429, { 'Retry-After': '60' });
    expect(await probePdf('duongdi', 'vi')).toEqual({
      state: 'unavailable',
      reason: 'rate_limited',
      retryAfterMs: 60_000,
    });
  });
  it('asks the same address the ready link opens, never from the cache', async () => {
    answer(200, PDF);
    await probePdf('duongdi', 'en');
    const [url, init] = vi.mocked(fetch).mock.calls[0]!;
    expect(url).toBe(problemPdfUrl('duongdi', 'en'));
    expect(init).toMatchObject({ cache: 'no-store', credentials: 'same-origin' });
  });
  it('maps 404 and other statuses to ApiError and a dead network to network_error', async () => {
    answer(404);
    await expect(probePdf('x', 'vi')).rejects.toMatchObject({ code: 'not_found', status: 404 });
    answer(500);
    await expect(probePdf('x', 'vi')).rejects.toMatchObject({ code: 'generic' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    await expect(probePdf('x', 'vi')).rejects.toMatchObject({ code: 'network_error' });
  });
});
