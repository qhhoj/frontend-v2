import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick, ref } from 'vue';
import type { Ref } from 'vue';
import { installFakeEventSource, latestEventSource } from '@/test/fake-event-source';
import { mockApi, ok } from '@/test/mock-api';
import { useSubmissionStatus } from './use-submission-status';

const row = (status: string, result: string | null, currentTestcase = 0) =>
  ok({ id: 'abc', status, result, currentTestcase });

function follow(id: Ref<string | null>, viewer: Ref<string> = ref('viewer-a')) {
  const queryClient = new QueryClient();
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  const wrapper = mount(
    defineComponent({
      setup: () => ({ live: useSubmissionStatus(id, viewer) }),
      render: () => null,
    }),
    { global: { plugins: [[VueQueryPlugin, { queryClient }]] } },
  );
  return {
    queryClient,
    live: (wrapper.vm as unknown as { live: ReturnType<typeof useSubmissionStatus> }).live,
    wrapper,
    invalidate,
  };
}

describe('useSubmissionStatus', () => {
  beforeEach(installFakeEventSource);

  it('reopens the stream when another account takes over the tab', async () => {
    const viewer = ref('viewer-a');
    follow(ref('abc'), viewer);
    const first = latestEventSource();
    viewer.value = 'viewer-b';
    await nextTick();
    expect(first.closed).toBe(true);
    expect(latestEventSource()).not.toBe(first);
    expect(latestEventSource().url).toBe('/api/internal/events/submissions/abc');
  });

  it('reports progress from the stream', async () => {
    const { live } = follow(ref('abc'));
    expect(latestEventSource().url).toBe('/api/internal/events/submissions/abc');
    latestEventSource().emit('state', {
      submissionId: 'abc',
      status: 'QU',
      result: null,
      currentTestcase: null,
    });
    latestEventSource().emit('test-case', {
      submissionId: 'abc',
      type: 'test-case',
      status: 'G',
      currentTestcase: 3,
    });
    await flushPromises();
    expect(live).toMatchObject({ status: 'G', currentTestcase: 3, done: false });
  });

  it('reads the final row once on done, closes the stream and refreshes submission lists', async () => {
    const calls = mockApi({ 'GET /submissions/abc': row('D', 'AC') });
    const { live, queryClient } = follow(ref('abc'));
    for (const scope of ['list', 'detail', 'stats', 'source'])
      queryClient.setQueryData(['submissions', scope, 'x'], {});
    const stream = latestEventSource();
    stream.emit('done', { submissionId: 'abc', type: 'done', status: 'D' });
    stream.emit('done', { submissionId: 'abc', type: 'done', status: 'D' });
    await flushPromises();
    expect(live).toMatchObject({ status: 'D', result: 'AC', done: true });
    expect(stream.closed).toBe(true);
    expect(calls).toHaveLength(1);
    const isStale = (key: unknown[]) => queryClient.getQueryState(key)!.isInvalidated;
    expect(
      ['list', 'detail', 'stats'].map((scope) => isStale(['submissions', scope, 'x'])),
    ).toEqual([true, true, true]);
    expect(isStale(['submissions', 'source', 'x'])).toBe(false);
  });

  it('finishes at once when the state is already final', async () => {
    mockApi({ 'GET /submissions/abc': row('CE', 'CE') });
    const { live } = follow(ref('abc'));
    latestEventSource().emit('state', {
      submissionId: 'abc',
      status: 'CE',
      result: 'CE',
      currentTestcase: null,
    });
    await flushPromises();
    expect(live).toMatchObject({ result: 'CE', done: true });
    expect(latestEventSource().closed).toBe(true);
  });

  it('rereads the submission on resync and keeps following', async () => {
    mockApi({ 'GET /submissions/abc': row('G', null, 5) });
    const { live } = follow(ref('abc'));
    latestEventSource().emit('resync', {});
    await flushPromises();
    expect(live).toMatchObject({ status: 'G', currentTestcase: 5, done: false });
    expect(latestEventSource().closed).toBe(false);
  });

  it('finishes from the stored row when resync finds it final', async () => {
    const calls = mockApi({ 'GET /submissions/abc': row('D', 'WA') });
    const { live } = follow(ref('abc'));
    latestEventSource().emit('resync', {});
    await flushPromises();
    expect(live).toMatchObject({ status: 'D', result: 'WA', done: true });
    expect(calls).toHaveLength(1);
  });

  it('falls back to the stored row when the stream is closed for good', async () => {
    const calls = mockApi({ 'GET /submissions/abc': row('D', 'AC') });
    const { live } = follow(ref('abc'));
    latestEventSource().fail();
    await flushPromises();
    expect(live).toMatchObject({ status: 'D', result: 'AC', done: true });
    expect(calls).toHaveLength(1);
  });

  it('stops the dead stream, without finishing, when the stored row is still running', async () => {
    mockApi({ 'GET /submissions/abc': row('P', null) });
    const { live } = follow(ref('abc'));
    latestEventSource().fail();
    await flushPromises();
    expect(live).toMatchObject({ status: 'P', done: false, stale: true });
    expect(latestEventSource().closed).toBe(true);
  });

  it('is stale when the stream is gone and the row cannot be read', async () => {
    mockApi({
      'GET /submissions/abc': { status: 404, body: { error: { code: 'not_found', message: 'x' } } },
    });
    const { live } = follow(ref('abc'));
    latestEventSource().fail();
    await flushPromises();
    expect(live).toMatchObject({ status: null, done: false, stale: true });
  });

  it('is not stale when the final row was read', async () => {
    mockApi({ 'GET /submissions/abc': row('D', 'AC') });
    const { live } = follow(ref('abc'));
    latestEventSource().fail();
    await flushPromises();
    expect(live.stale).toBe(false);
  });

  it('ignores frames without a status', async () => {
    const { live } = follow(ref('abc'));
    latestEventSource().emit('state', {});
    latestEventSource().emit('done', {});
    await flushPromises();
    expect(live).toMatchObject({ status: null, done: false });
  });

  it('finishes once when done arrives while a resync read is in flight', async () => {
    const calls = mockApi({ 'GET /submissions/abc': row('D', 'AC') });
    const { live, invalidate } = follow(ref('abc'));
    const stream = latestEventSource();
    stream.emit('resync', {});
    stream.emit('done', { submissionId: 'abc', type: 'done', status: 'D' });
    await flushPromises();
    expect(live).toMatchObject({ result: 'AC', done: true });
    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(calls).toHaveLength(2);
  });

  it('drops a stale row when the id returns to the same value mid-read', async () => {
    let answer!: (response: Response) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>((resolve) => (answer = resolve))),
    );
    const id = ref<string | null>('abc');
    const { live } = follow(id);
    latestEventSource().emit('resync', {});
    id.value = null;
    await nextTick();
    id.value = 'abc';
    await nextTick();
    answer(
      new Response(
        JSON.stringify({ data: { id: 'abc', status: 'D', result: 'AC', currentTestcase: 0 } }),
      ),
    );
    await flushPromises();
    expect(live).toMatchObject({ status: null, done: false });
    expect(latestEventSource().closed).toBe(false);
  });

  it('follows a new id and closes the old stream; null stops following', async () => {
    const id = ref<string | null>('abc');
    follow(id);
    const first = latestEventSource();
    id.value = 'def';
    await flushPromises();
    expect(first.closed).toBe(true);
    expect(latestEventSource().url).toBe('/api/internal/events/submissions/def');
    id.value = null;
    await flushPromises();
    expect(latestEventSource().closed).toBe(true);
  });
});
