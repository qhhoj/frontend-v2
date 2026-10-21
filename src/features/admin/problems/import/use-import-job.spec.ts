import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, ref } from 'vue';
import { ApiError } from '@/api/client';
import { fetchImportJob } from '@/api/problem-imports.api';
import type { ImportJob } from '@/api/types/problem-imports';
import { importJob } from '@/test/admin-fixtures/polygon';
import { useImportJob } from './use-import-job';

vi.mock('@/api/problem-imports.api', () => ({ fetchImportJob: vi.fn() }));
const fetchMock = vi.mocked(fetchImportJob);

const job = (state: string, id = 'job-1'): ImportJob => importJob({ id, state });
const apiError = (status: number) => new ApiError('error', status, 'error');
const callsFor = (id: string) => fetchMock.mock.calls.filter(([called]) => called === id).length;

/** The composable needs a component instance for its unmount hook. */
function mountPoll(initialId: string | null) {
  const jobId = ref<string | null>(initialId);
  let view!: ReturnType<typeof useImportJob>;
  mount(
    defineComponent({
      setup() {
        view = useImportJob(jobId);
        return () => null;
      },
    }),
  );
  return { jobId, view };
}

beforeEach(() => {
  vi.useFakeTimers();
  fetchMock.mockReset();
});
afterEach(() => vi.useRealTimers());

describe('useImportJob stops and retries', () => {
  it.each([
    ["a 404 (expired or someone else's job)", apiError(404), 'notFound'],
    ['a 403', apiError(403), 'forbidden'],
    ['a 401', apiError(401), 'forbidden'],
  ])('stops at once on %s', async (_label, error, reason) => {
    fetchMock.mockRejectedValue(error);
    const { view } = mountPoll('job-1');
    await flushPromises();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(view.stop.value).toBe(reason);
    expect(callsFor('job-1')).toBe(1);
  });

  it('stops at once on the unknown BullMQ state', async () => {
    fetchMock.mockResolvedValue(job('unknown'));
    const { view } = mountPoll('job-1');
    await flushPromises();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(view.stop.value).toBe('unknown');
    expect(callsFor('job-1')).toBe(1);
  });

  it('retries a network error with backoff, then gives up after the last retry', async () => {
    fetchMock.mockRejectedValue(new ApiError('network_error', 0, 'Network error'));
    const { view } = mountPoll('job-1');
    await flushPromises();
    await vi.advanceTimersByTimeAsync(1999);
    expect(callsFor('job-1')).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(callsFor('job-1')).toBe(2);
    await vi.advanceTimersByTimeAsync(10 * 60_000);
    expect(view.stop.value).toBe('gaveUp');
    const attempts = callsFor('job-1');
    expect(attempts).toBe(6);
    await vi.advanceTimersByTimeAsync(10 * 60_000);
    expect(callsFor('job-1')).toBe(attempts);
  });

  it('asks again on a recheck after giving up, keeping the last job seen until the answer', async () => {
    fetchMock
      .mockResolvedValueOnce(job('active'))
      .mockRejectedValue(new ApiError('network_error', 0, 'Network error'));
    const { view } = mountPoll('job-1');
    await flushPromises();
    await vi.advanceTimersByTimeAsync(10 * 60_000);
    expect(view.stop.value).toBe('gaveUp');
    let answer!: (value: ImportJob) => void;
    fetchMock.mockImplementation(() => new Promise((resolve) => (answer = resolve)));
    view.recheck();
    expect(view.stop.value).toBeNull();
    expect(view.job.value?.state).toBe('active');
    answer(job('completed'));
    await flushPromises();
    expect(view.job.value?.state).toBe('completed');
  });

  it('keeps polling after a 503 when the next answer comes back', async () => {
    fetchMock.mockRejectedValueOnce(apiError(503)).mockResolvedValue(job('completed'));
    const { view } = mountPoll('job-1');
    await flushPromises();
    expect(view.failure.value).toBeInstanceOf(ApiError);
    await vi.advanceTimersByTimeAsync(2000);
    expect(view.job.value?.state).toBe('completed');
    expect(view.failure.value).toBeNull();
    expect(view.stop.value).toBeNull();
  });

  it('drops an answer that comes back for the job it was replaced from', async () => {
    let answerOld!: (value: ImportJob) => void;
    fetchMock.mockImplementation((id) =>
      id === 'job-1'
        ? new Promise<ImportJob>((resolve) => {
            answerOld = resolve;
          })
        : Promise.resolve(job('completed', 'job-2')),
    );
    const { jobId, view } = mountPoll('job-1');
    jobId.value = 'job-2';
    await flushPromises();
    answerOld(job('active', 'job-1'));
    await flushPromises();
    expect(view.job.value?.id).toBe('job-2');
    await vi.advanceTimersByTimeAsync(10_000);
    expect(callsFor('job-1')).toBe(1);
  });
});
