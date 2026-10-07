import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { translate } from '@/i18n';
import { useLocaleStore } from './locale.store';

describe('useLocaleStore', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('starts in Vietnamese and marks the document language', () => {
    useLocaleStore();
    expect(translate('nav.problems')).toBe('Bài tập');
    expect(document.documentElement.lang).toBe('vi');
  });

  it('restores a stored locale', () => {
    localStorage.setItem('qhhoj.locale', 'en');
    useLocaleStore();
    expect(translate('nav.problems')).toBe('Problems');
  });

  it('ignores an unsupported stored locale', () => {
    localStorage.setItem('qhhoj.locale', 'fr');
    expect(useLocaleStore().locale).toBe('vi');
  });

  it('toggles, translates and persists', async () => {
    const store = useLocaleStore();
    store.toggle();
    await nextTick();
    expect(translate('nav.problems')).toBe('Problems');
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem('qhhoj.locale')).toBe('en');
  });

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
    vi.restoreAllMocks();
  });

  it('ignores a corrupt stored value', () => {
    localStorage.setItem('qhhoj.locale', '{"not":"a locale"}');
    expect(useLocaleStore().locale).toBe('vi');
  });
});
