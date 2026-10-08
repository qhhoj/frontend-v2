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

  it('counts a source once and ignores ending a source that never began', () => {
    const loading = useLoadingStore();
    const source = Symbol('source');
    loading.begin(source);
    loading.begin(source);
    loading.end(source);
    expect(loading.isWaiting).toBe(false);
    expect(() => loading.end(Symbol('other'))).not.toThrow();
  });
});
