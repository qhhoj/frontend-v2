import { describe, expect, it } from 'vitest';
import type { ImportJob } from '@/api/types/problem-imports';
import { downloadProgressOf, importStepsOf } from './import-steps';

const statuses = (steps: ReturnType<typeof importStepsOf>) =>
  steps.map((step) => `${step.key}:${step.status}`);

describe('importStepsOf', () => {
  it('lists the download step only for a Polygon job', () => {
    expect(importStepsOf('polygon', 'queued').map((step) => step.key)).toEqual([
      'queued',
      'downloading',
      'statements',
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
      'downloading:done',
      'statements:current',
      'tests:pending',
      'end:pending',
    ]);
  });

  it('marks every step done when the job is done', () => {
    expect(importStepsOf('zip', 'done').every((step) => step.status === 'done')).toBe(true);
  });

  it('fails the last step the page saw and keeps the earlier ones done', () => {
    expect(statuses(importStepsOf('polygon', 'failed', 'tests'))).toEqual([
      'queued:done',
      'downloading:done',
      'statements:done',
      'tests:failed',
      'end:failed',
    ]);
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

const job = (progress: ImportJob['progress']): ImportJob => ({
  id: 'job-1',
  state: 'active',
  step: progress?.step ?? 'queued',
  progress,
  result: null,
  error: null,
});

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
