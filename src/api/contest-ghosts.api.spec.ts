import { describe, expect, it } from 'vitest';
import { ghost, GHOST_CSV } from '@/test/admin-fixtures/ghosts';
import { fail, issue, mockApi, noContent, ok } from '@/test/mock-api';
import { deleteGhosts, fetchGhosts, ghostsCsvUrl, importGhosts } from './contest-ghosts.api';

describe('contest ghosts api', () => {
  it('lists the set of the encoded contest', async () => {
    const calls = mockApi({ 'GET /contests/a%20b/ghosts': ok({ ghosts: [ghost()] }) });
    expect((await fetchGhosts('a b')).ghosts.map((row) => row.label)).toEqual(['Ann']);
    expect(calls[0]!.path).toBe('/contests/a%20b/ghosts');
  });

  it('sends the CSV with the preview and anonymise flags as the body of a PUT', async () => {
    const calls = mockApi({ 'PUT /contests/w41/ghosts': ok({ stored: false, ghosts: [ghost()] }) });
    const preview = await importGhosts('w41', { csv: GHOST_CSV, anonymize: true, dryRun: true });
    expect(preview.stored).toBe(false);
    expect(calls[0]!.method).toBe('PUT');
    expect(calls[0]!.body).toEqual({ csv: GHOST_CSV, anonymize: true, dryRun: true });
  });

  it('surfaces the per-row refusal with every row code', async () => {
    const issues = [
      { ...issue('csv', 'label_formula', 'x'), row: 2 },
      { ...issue('csv', 'cell_invalid', 'x'), row: 3 },
    ];
    mockApi({ 'PUT /contests/w41/ghosts': fail(400, 'ghost_import_invalid', undefined, issues) });
    await expect(importGhosts('w41', { csv: 'x' })).rejects.toMatchObject({
      code: 'ghost_import_invalid',
      issues,
    });
  });

  it('deletes the set and names the CSV download address', async () => {
    const calls = mockApi({ 'DELETE /contests/w41/ghosts': noContent() });
    expect(await deleteGhosts('w41')).toBeUndefined();
    expect(calls.map((call) => [call.method, call.path])).toEqual([
      ['DELETE', '/contests/w41/ghosts'],
    ]);
    expect(ghostsCsvUrl('a b')).toBe('/api/internal/contests/a%20b/ghosts/csv');
  });
});
