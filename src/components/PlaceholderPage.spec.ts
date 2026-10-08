import { describe, expect, it } from 'vitest';
import { signedOut } from '@/test/fixtures';
import { mockApi } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

describe('placeholder page', () => {
  it('shows a sleeping decorative Bit above the heading of a page that is not built yet', async () => {
    mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/blog');
    const bit = wrapper.get('main [data-testid="inline-bit"]');
    expect(bit.attributes('aria-hidden')).toBe('true');
    expect(wrapper.get('main h1').text().length).toBeGreaterThan(0);
  });
});
