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

  it('ignores a wait that begins after the page painted, until the next page begins', () => {
    const loading = useLoadingStore();
    const page = Symbol('page');
    const firstCard = Symbol('first card');
    const secondCard = Symbol('second card');
    loading.beginPage(page);
    loading.end(page);
    loading.begin(firstCard);
    loading.begin(secondCard);
    loading.paint(firstCard);
    expect(loading.isWaiting).toBe(true); // the second card began before the paint: it still counts
    loading.paint(secondCard);
    loading.begin(Symbol('comments below'));
    expect(loading.isWaiting).toBe(false);
    loading.beginPage(Symbol('next page'));
    expect(loading.isWaiting).toBe(true);
  });

  it('does not count the end of a wait that stops without content as a paint', () => {
    const loading = useLoadingStore();
    loading.beginPage(Symbol('navigation'));
    const card = Symbol('card');
    loading.begin(card);
    loading.end(card);
    loading.begin(Symbol('section'));
    expect(loading.isWaiting).toBe(true);
  });
});
