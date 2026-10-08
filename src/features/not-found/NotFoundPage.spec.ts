import { describe, expect, it } from 'vitest';
import { signedOut } from '@/test/fixtures';
import { mockApi } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

describe('not found page', () => {
  it('renders for an unknown path with the heading, copy, both links and the requested path', async () => {
    mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/problems/lsi/oops');
    expect(wrapper.get('h1').text()).toBe('Không tìm thấy trang');
    expect(wrapper.get('main a[href="/"]').text()).toBe('Về trang chủ');
    expect(wrapper.get('main a[href="/problems"]').text()).toBe('Xem danh sách bài');
    expect(wrapper.get('[data-testid="requested-path"]').text()).toBe('/problems/lsi/oops');
    expect(document.title).toContain('Không tìm thấy');
  });

  it('shows the requested path as text, never as markup', async () => {
    mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/%3Cb%3Ex%3C%2Fb%3E');
    expect(wrapper.find('[data-testid="requested-path"] b').exists()).toBe(false);
  });

  it('draws Bit crying with a spoken label, and the giant 404 is decoration', async () => {
    mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/nope');
    const bit = wrapper.get('[role="img"]');
    expect(bit.attributes('aria-label')).toBe('Bit đang khóc');
    expect(bit.find('[data-blinking="true"]').exists()).toBe(true); // closed eyes
    expect(bit.findAll('.bit-tear')).toHaveLength(2);
    expect(wrapper.get('[data-testid="pale-404"]').attributes('aria-hidden')).toBe('true');
  });
});
