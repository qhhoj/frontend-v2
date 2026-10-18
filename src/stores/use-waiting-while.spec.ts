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

  /** A component waiting on each condition, as a page with one `QueryState` per condition would. */
  const mountProbe = (...conditions: Array<() => boolean>) => {
    const Probe = defineComponent({
      setup() {
        const router = useRouter();
        settleFirstNavigation = () => router.isReady();
        conditions.forEach((condition) => useWaitingWhile(condition));
        return () => h('p');
      },
    });
    return mountComponent(Probe);
  };

  it('registers a waiting source while the condition holds, and releases it when it ends', async () => {
    const condition = ref(true);
    mountProbe(() => condition.value);
    const loading = useLoadingStore();
    await settleFirstNavigation();
    expect(loading.isWaiting).toBe(true);
    condition.value = false;
    await flushPromises();
    expect(loading.isWaiting).toBe(false);
  });

  it('releases its waiting source when the component goes', async () => {
    const wrapper = mountProbe(() => true);
    const loading = useLoadingStore();
    await settleFirstNavigation();
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

  it('marks the page painted when the content shows, so a wait that starts later does not count', async () => {
    const isCardLoading = ref(false);
    const isSectionLoading = ref(false);
    mountProbe(
      () => isCardLoading.value,
      () => isSectionLoading.value,
    );
    const loading = useLoadingStore();
    await settleFirstNavigation();
    isCardLoading.value = true;
    await flushPromises();
    expect(loading.isWaiting).toBe(true);
    isCardLoading.value = false;
    isSectionLoading.value = true;
    await flushPromises();
    expect(loading.isWaiting).toBe(false);
    isCardLoading.value = true; // the card loads again (a new key): the page has content, its skeleton says enough
    await flushPromises();
    expect(loading.isWaiting).toBe(false);
  });
});
