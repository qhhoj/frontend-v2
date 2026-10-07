import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, ref } from 'vue';
import type { Ref } from 'vue';
import { installFakeEventSource, latestEventSource } from '@/test/fake-event-source';
import { mockApi, ok } from '@/test/mock-api';
import { useSubmissionStatus } from './use-submission-status';

const row = (status: string, result: string | null, currentTestcase = 0) =>
  ok({ id: 'abc', status, result, currentTestcase });

function follow(id: Ref<string | null>) {
  const queryClient = new QueryClient();
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  const wrapper = mount(
    defineComponent({ setup: () => ({ live: useSubmissionStatus(id) }), render: () => null }),
    { global: { plugins: [[VueQueryPlugin, { queryClient }]] } },
  );
  return {
    live: (wrapper.vm as unknown as { live: ReturnType<typeof useSubmissionStatus> }).live,
    wrapper,
    invalidate,
  };
}

describe('useSubmissionStatus', () => {
  beforeEach(installFakeEventSource);

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
    const { live, invalidate } = follow(ref('abc'));
    const stream = latestEventSource();
    stream.emit('done', { submissionId: 'abc', type: 'done', status: 'D' });
    stream.emit('done', { submissionId: 'abc', type: 'done', status: 'D' });
    await flushPromises();
    expect(live).toMatchObject({ status: 'D', result: 'AC', done: true });
    expect(stream.closed).toBe(true);
    expect(calls).toHaveLength(1);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['submissions'] });
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
    expect(live).toMatchObject({ status: 'P', done: false });
    expect(latestEventSource().closed).toBe(true);
  });

  it('leaves a retrying connection alone', async () => {
    const calls = mockApi({});
    follow(ref('abc'));
    latestEventSource().fail(true);
    await flushPromises();
    expect(calls).toHaveLength(0);
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

  it('closes the stream when the component unmounts', () => {
    const { wrapper } = follow(ref('abc'));
    wrapper.unmount();
    expect(latestEventSource().closed).toBe(true);
  });
});
