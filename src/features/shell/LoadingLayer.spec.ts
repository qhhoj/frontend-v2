import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLoadingStore } from '@/stores/loading.store';
import { stubMatchMedia } from '@/test/match-media';
import { signedOut } from '@/test/fixtures';
import { mockApi } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import LoadingLayer from './LoadingLayer.vue';
import { LOADING_TIMING } from './use-loading-phase';

describe('LoadingLayer', () => {
  /** Mounting also starts the router's first navigation; let it land so only the spec's own wait counts. */
  const mountSettled = async () => {
    const wrapper = mountComponent(LoadingLayer);
    await vi.dynamicImportSettled();
    await vi.advanceTimersByTimeAsync(0);
    return wrapper;
  };

  beforeEach(() => {
    mockApi({ 'GET /auth/me': signedOut });
    vi.useFakeTimers();
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 1),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });
  afterEach(() => vi.useRealTimers());

  it('announces loading once, only after the threshold, and clears it when loading ends', async () => {
    const wrapper = await mountSettled();
    const loading = useLoadingStore();
    const source = Symbol('page');
    const region = () => wrapper.get('[role="status"]');
    expect(wrapper.findAll('[role="status"]')).toHaveLength(1);
    expect(region().attributes('aria-live')).toBe('polite');
    loading.begin(source);
    await vi.advanceTimersByTimeAsync(LOADING_TIMING.showAfterMs - 1);
    expect(region().text()).toBe('');
    await vi.advanceTimersByTimeAsync(1);
    expect(region().text()).toBe('Đang tải…');
    expect(wrapper.findAll('[data-testid="loading-bit"]').length).toBeGreaterThan(0);
    loading.end(source);
    await vi.advanceTimersByTimeAsync(LOADING_TIMING.settleMs);
    expect(region().text()).toBe('');
  });

  it('walks the Bits off when loading ends, and hides the layer once they are gone', async () => {
    const wrapper = await mountSettled();
    const loading = useLoadingStore();
    const source = Symbol('page');
    loading.begin(source);
    await vi.advanceTimersByTimeAsync(LOADING_TIMING.showAfterMs);
    loading.end(source);
    await vi.advanceTimersByTimeAsync(LOADING_TIMING.settleMs);
    expect(wrapper.get('[data-testid="loading-bits"]').attributes('data-phase')).toBe('leaving');
    await vi.advanceTimersByTimeAsync(LOADING_TIMING.leaveMs);
    expect(wrapper.get('[data-testid="loading-bits"]').attributes('data-phase')).toBe('fading');
    await vi.advanceTimersByTimeAsync(LOADING_TIMING.fadeMs);
    expect(wrapper.find('[data-testid="loading-bits"]').exists()).toBe(false);
  });

  it('shows nothing for a load that ends before the threshold', async () => {
    const wrapper = await mountSettled();
    const loading = useLoadingStore();
    const source = Symbol('fast page');
    loading.begin(source);
    await vi.advanceTimersByTimeAsync(300);
    loading.end(source);
    await vi.advanceTimersByTimeAsync(5000);
    expect(wrapper.find('[data-testid="loading-bit"]').exists()).toBe(false);
    expect(wrapper.get('[role="status"]').text()).toBe('');
  });

  it('under reduced motion still announces once while a single Bit stands', async () => {
    stubMatchMedia({ reducedMotion: true });
    const wrapper = await mountSettled();
    useLoadingStore().begin(Symbol('page'));
    await vi.advanceTimersByTimeAsync(LOADING_TIMING.showAfterMs);
    expect(wrapper.get('[role="status"]').text()).toBe('Đang tải…');
    expect(wrapper.findAll('[data-testid="loading-bit"]')).toHaveLength(1);
  });
});
