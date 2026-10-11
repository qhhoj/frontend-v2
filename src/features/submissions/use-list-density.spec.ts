import { nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DENSITY_STORAGE_KEY, useListDensity } from './use-list-density';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('useListDensity', () => {
  it('starts with the cards, and remembers the choice for the next visit', async () => {
    const density = useListDensity();
    expect(density.value).toBe('comfortable');
    density.value = 'compact';
    await nextTick();
    expect(useListDensity().value).toBe('compact');
  });

  it('ignores a stored value it does not know', () => {
    localStorage.setItem(DENSITY_STORAGE_KEY, 'huge');
    expect(useListDensity().value).toBe('comfortable');
  });

  it('still switches when the browser refuses storage', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    const density = useListDensity();
    density.value = 'compact';
    await nextTick();
    expect(density.value).toBe('compact');
  });
});
