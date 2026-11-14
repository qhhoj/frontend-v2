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
  it('sends / to the page search and Ctrl K to the palette, never from a field or an editor', async () => {
    mockApi({ ...problemListRoutes, ...anonymousViewer });
    const { wrapper } = await mountApp('/problems');
    const field = wrapper.get<HTMLInputElement>('#main input[type="search"]').element;

    press('/');
    expect(document.activeElement).toBe(field);
    // Typed into a text field, `/` is a slash.
    expect(press('/', {}, field)).toBe(true);
    expect(palette()).toBeNull();

    // In a text field or a code editor Ctrl K edits text (a Mac's "delete to end of line"): no palette.
    const editor = document.createElement('div');
    editor.setAttribute('contenteditable', 'true');
    editor.innerHTML = '<div class="cm-line">x</div>';
    wrapper.get('#main').element.append(editor);
    for (const target of [field, editor.firstElementChild!]) {
      expect(press('k', { ctrlKey: true }, target)).toBe(true);
      await flushPromises();
      expect(palette()).toBeNull();
    }

    press('k', { ctrlKey: true });
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
