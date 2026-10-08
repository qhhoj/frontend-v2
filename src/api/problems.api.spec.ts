import { describe, expect, it } from 'vitest';
import { problemDetail } from '@/test/fixtures';
import { mockApi, ok } from '@/test/mock-api';
import { fetchProblem, problemPdfUrl } from './problems.api';

describe('problem detail', () => {
  it('asks for the detail in the given statement language and encodes the code', async () => {
    const calls = mockApi({ 'GET /problems/a%2Fb': ok(problemDetail()) });
    await fetchProblem('a/b', 'en');
    expect(calls[0]!.query.get('lang')).toBe('en');
    expect(calls[0]!.path).toBe('/problems/a%2Fb');
  });
  it('builds the PDF address without calling the API', () => {
    expect(problemPdfUrl('duongdi', 'vi')).toBe('/api/internal/problems/duongdi/pdf?lang=vi');
  });
});
