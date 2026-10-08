import { describe, expect, it } from 'vitest';
import { signedInViewer } from '@/test/problem-routes';
import { mountApp } from '@/test/mount';
import { mockApi } from '@/test/mock-api';

describe('placeholder page', () => {
  it('shows a sleeping decorative Bit above the heading of a page that is not built yet', async () => {
    mockApi({ ...signedInViewer() });
    const { wrapper } = await mountApp('/blog/new');
    const bit = wrapper.get('main [data-testid="inline-bit"]');
    expect(bit.attributes('aria-hidden')).toBe('true');
    expect(wrapper.get('main h1').text().length).toBeGreaterThan(0);
  });
});
