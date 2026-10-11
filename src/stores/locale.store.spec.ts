import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { translate } from '@/i18n';
import { useLocaleStore } from './locale.store';

describe('useLocaleStore', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('still switches language when localStorage throws', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    const store = useLocaleStore();
    expect(store.locale).toBe('vi');
    store.toggle();
    await nextTick();
    expect(translate('nav.problems')).toBe('Problems');
  });

  it('ignores a corrupt stored value', () => {
    localStorage.setItem('qhhoj.locale', '{"not":"a locale"}');
    expect(useLocaleStore().locale).toBe('vi');
  });
});
