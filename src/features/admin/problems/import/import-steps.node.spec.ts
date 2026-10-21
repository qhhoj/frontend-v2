import { describe, expect, it } from 'vitest';
import type { ImportJob } from '@/api/types/problem-imports';
import { importJob } from '@/test/admin-fixtures/polygon';
import { downloadProgressOf, failedRowOf, importStepsOf } from './import-steps';

const statuses = (steps: ReturnType<typeof importStepsOf>) =>
  steps.map((step) => `${step.key}:${step.status}`);

describe('importStepsOf', () => {
  it('lists the checks and the download only for a Polygon job', () => {
    expect(importStepsOf('polygon', 'queued').map((step) => step.key)).toEqual([
      'queued',
      'checking',
      'downloading',
      'statements',
      'generating',
      'tests',
      'end',
    ]);
    expect(importStepsOf('zip', 'queued').map((step) => step.key)).toEqual([
      'queued',
      'statements',
      'tests',
      'end',
    ]);
  });

  it('marks the steps before the current one done and the rest pending', () => {
    expect(statuses(importStepsOf('polygon', 'statements'))).toEqual([
      'queued:done',
      'checking:done',
      'downloading:done',
      'statements:current',
      'generating:pending',
      'tests:pending',
      'end:pending',
    ]);
  });

  it('marks every step done when the job is done', () => {
    expect(importStepsOf('zip', 'done').every((step) => step.status === 'done')).toBe(true);
  });

  it('passes the checks only once the download starts', () => {
    expect(statuses(importStepsOf('polygon', 'queued')).slice(0, 3)).toEqual([
      'queued:current',
      'checking:pending',
      'downloading:pending',
    ]);
    expect(statuses(importStepsOf('polygon', 'downloading')).slice(0, 3)).toEqual([
      'queued:done',
      'checking:done',
      'downloading:current',
    ]);
  });

  it('fails the last step the page saw and keeps the earlier ones done', () => {
    expect(statuses(importStepsOf('polygon', 'failed', 'tests'))).toEqual([
      'queued:done',
      'checking:done',
      'downloading:done',
      'statements:done',
      'generating:done',
      'tests:failed',
      'end:failed',
    ]);
  });

  it('places the server failure step: the checks fail their row (the first one of a zip import), the write and the file moves the end', () => {
    expect(statuses(importStepsOf('polygon', 'failed', failedRowOf('checking')))).toEqual([
      'queued:done',
      'checking:failed',
      'downloading:pending',
      'statements:pending',
      'generating:pending',
      'tests:pending',
      'end:failed',
    ]);
    expect(statuses(importStepsOf('zip', 'failed', failedRowOf('checking')))).toEqual([
      'queued:failed',
      'statements:pending',
      'tests:pending',
      'end:failed',
    ]);
    expect(statuses(importStepsOf('zip', 'failed', failedRowOf('saving')))).toEqual([
      'queued:done',
      'statements:done',
      'tests:done',
      'end:failed',
    ]);
    expect(failedRowOf('finishing')).toBe('end');
    expect(failedRowOf('downloading')).toBe('downloading');
  });

  it('fails only the end when the page never saw the job run', () => {
    expect(statuses(importStepsOf('zip', 'failed'))).toEqual([
      'queued:pending',
      'statements:pending',
      'tests:pending',
      'end:failed',
    ]);
  });
});

const job = (progress: ImportJob['progress']): ImportJob =>
  importJob({ state: 'active', step: progress?.step ?? 'queued', progress });

describe('downloadProgressOf', () => {
  it('gives the bytes and the share while downloading', () => {
    expect(downloadProgressOf(job({ step: 'downloading', done: 256, total: 1024 }))).toEqual({
      done: 256,
      total: 1024,
      share: 0.25,
    });
  });

  it('has no share when Polygon sent no size', () => {
    expect(downloadProgressOf(job({ step: 'downloading', done: 256, total: null }))?.share).toBe(
      null,
    );
  });

  it('is null outside the download and before the first bytes', () => {
    expect(downloadProgressOf(job({ step: 'tests', done: null, total: null }))).toBe(null);
    expect(downloadProgressOf(job({ step: 'downloading', done: null, total: null }))).toBe(null);
    expect(downloadProgressOf(null)).toBe(null);
  });
});
