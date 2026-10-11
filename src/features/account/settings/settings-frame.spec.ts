import { describe, expect, it } from 'vitest';
import { signedOut } from '@/test/fixtures';
import { mockApi } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

const sectionNav = '#main nav[aria-label="Các mục cài đặt"]';

describe('settings frame', () => {
  it('shows an anonymous visitor the appearance page in the frame, without sections they cannot open', async () => {
    mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/settings/appearance');
    expect(wrapper.get('#main h1').text()).toBe('Cài đặt');
    expect(wrapper.find(sectionNav).exists()).toBe(false);
    expect(wrapper.get('#main nav[aria-label="Đường dẫn"]').find('a').exists()).toBe(false);
  });
});
