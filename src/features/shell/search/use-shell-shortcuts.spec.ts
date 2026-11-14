import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { blogListRoutes } from '@/test/community-routes';
import { problemMeta } from '@/test/fixtures';
import { mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';

const problemListRoutes = {
  'GET /problems/meta': ok(problemMeta()),
  'GET /problems': page([]),
};

const palette = () => document.body.querySelector('[data-testid="site-palette"]');
/** A key pressed on `target` (the page when none), as the window listener receives it. */
const press = (key: string, init: KeyboardEventInit = {}, target: EventTarget = document.body) =>
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }),
  );

describe('site search keys', () => {
  it('sends / to the page search and Ctrl K to the palette', async () => {
    mockApi({ ...problemListRoutes, ...anonymousViewer });
    const { wrapper } = await mountApp('/problems');
    const field = wrapper.get<HTMLInputElement>('#main input[type="search"]').element;

    press('/');
    expect(document.activeElement).toBe(field);
    // Typed into a text field, `/` is a slash.
    expect(press('/', {}, field)).toBe(true);
    expect(palette()).toBeNull();

    press('k', { ctrlKey: true }, field);
    await vi.waitFor(() => expect(palette()).not.toBeNull());
  });

  it('opens the palette on / where the page has no search box', async () => {
    mockApi({ ...blogListRoutes, ...anonymousViewer });
    await mountApp('/blog');
    press('/');
    await flushPromises();
    await vi.waitFor(() => expect(palette()).not.toBeNull());
  });
});
