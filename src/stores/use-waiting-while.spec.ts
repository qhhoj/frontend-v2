import { useQuery } from '@tanstack/vue-query';
import { flushPromises } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import { useRouter } from 'vue-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { signedOut } from '@/test/fixtures';
import { mockApi } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { useLoadingStore } from './loading.store';
import { useWaitingWhile } from './use-waiting-while';

describe('useWaitingWhile', () => {
  beforeEach(() => mockApi({ 'GET /auth/me': signedOut }));

  /** Installing the router starts the first navigation, which is itself a waiting source; let it land. */
  let settleFirstNavigation: () => Promise<unknown> = () => Promise.resolve();

  it('registers a waiting source while the condition holds, and releases it when it ends or the component goes', async () => {
    const condition = ref(true);
    const Probe = defineComponent({
      setup() {
        const router = useRouter();
        settleFirstNavigation = () => router.isReady();
        useWaitingWhile(() => condition.value);
        return () => h('p');
      },
    });
    const wrapper = mountComponent(Probe);
    const loading = useLoadingStore();
    await settleFirstNavigation();
    expect(loading.isWaiting).toBe(true);
    condition.value = false;
    await flushPromises();
    expect(loading.isWaiting).toBe(false);
    condition.value = true;
    await flushPromises();
    expect(loading.isWaiting).toBe(true);
    wrapper.unmount();
    expect(loading.isWaiting).toBe(false);
  });

  it('waits for the first data of a query but not for a background refetch', async () => {
    const answers: Array<(value: string) => void> = [];
    let refetchProbe: () => unknown = () => undefined;
    const Probe = defineComponent({
      setup() {
        const router = useRouter();
        settleFirstNavigation = () => router.isReady();
        const query = useQuery({
          queryKey: ['probe'],
          queryFn: () => new Promise<string>((resolve) => answers.push(resolve)),
        });
        refetchProbe = query.refetch;
        useWaitingWhile(() => query.isPending.value);
        return () => h('p', query.data.value ?? '');
      },
    });
    mountComponent(Probe);
    const loading = useLoadingStore();
    await settleFirstNavigation();
    expect(loading.isWaiting).toBe(true);
    answers[0]?.('first');
    await flushPromises();
    expect(loading.isWaiting).toBe(false);
    void refetchProbe();
    await flushPromises();
    expect(answers).toHaveLength(2); // the refetch is in flight
    expect(loading.isWaiting).toBe(false);
    answers[1]?.('second');
    await flushPromises();
    expect(loading.isWaiting).toBe(false);
  });
});
