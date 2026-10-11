import { describe, expect, it } from 'vitest';
import { signedOut } from '@/test/fixtures';
import { fail, mockApi } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

describe('not found page', () => {
  it('shows the requested path as text, never as markup', async () => {
    mockApi({
      'GET /auth/me': signedOut,
      'GET /pages/a%26amp%3Bb': fail(404, 'not_found'),
    });
    const { wrapper } = await mountApp('/a&amp;b');
    const shown = wrapper.get('[data-testid="requested-path"]').element;
    expect(shown.children).toHaveLength(0);
    expect(shown.textContent?.trim()).toBe('/a&amp;b'); // markup would decode the entity to '&'
    expect(shown.innerHTML).toContain('&amp;amp;'); // and the text is escaped on the way out
  });
});
