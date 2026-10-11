import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useLoadingStore } from './loading.store';

describe('loading store', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('waits while any source is waiting and stops when the last one ends', () => {
    const loading = useLoadingStore();
    const first = Symbol('first');
    const second = Symbol('second');
    expect(loading.isWaiting).toBe(false);
    loading.begin(first);
    loading.begin(second);
    loading.end(first);
    expect(loading.isWaiting).toBe(true);
    loading.end(second);
    expect(loading.isWaiting).toBe(false);
  });
});
