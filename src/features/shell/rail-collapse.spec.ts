import { describe, expect, it, vi } from 'vitest';
import { blogListRoutes } from '@/test/community-routes';
import { mockApi } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';

describe('rail collapse', () => {
  it('toggles from the foot button and is remembered per browser', async () => {
    mockApi({ ...blogListRoutes, ...anonymousViewer });
    const { wrapper } = await mountApp('/blog');
    const button = wrapper.get('[data-testid="rail-collapse"]');
    expect(button.attributes('aria-expanded')).toBe('true');
    expect(wrapper.get('[data-rail]').attributes('data-rail')).toBe('open');

    await button.trigger('click');
    expect(button.attributes('aria-expanded')).toBe('false');
    expect(wrapper.get('[data-rail]').attributes('data-rail')).toBe('collapsed');
    expect(localStorage.getItem('qhhoj.rail-collapsed')).toBe('1');

    await button.trigger('click');
    expect(localStorage.getItem('qhhoj.rail-collapsed')).toBe('0');
  });

  it('starts collapsed when the browser remembers it, and expanded when storage fails', async () => {
    localStorage.setItem('qhhoj.rail-collapsed', '1');
    vi.resetModules();
    const collapsed = await import('./use-rail-collapse');
    expect(collapsed.useRailCollapse().isCollapsed.value).toBe(true);

    localStorage.clear();
    vi.resetModules();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const blocked = await import('./use-rail-collapse');
    expect(blocked.useRailCollapse().isCollapsed.value).toBe(false);
  });
});
