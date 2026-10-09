import { describe, expect, it } from 'vitest';
import { signedOut } from '@/test/fixtures';
import { fail, mockApi } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

describe('not found page', () => {
  it('renders for an unknown path with the heading, copy, both links and the requested path', async () => {
    mockApi({
      'GET /auth/me': signedOut,
      'GET /pages/problems%2Flsi%2Foops': fail(404, 'not_found'),
    });
    const { wrapper } = await mountApp('/problems/lsi/oops');
    expect(wrapper.get('h1').text()).toBe('Không tìm thấy trang');
    expect(wrapper.get('main a[href="/"]').text()).toBe('Về trang chủ');
    expect(wrapper.get('main a[href="/problems"]').text()).toBe('Xem danh sách bài');
    expect(wrapper.get('[data-testid="requested-path"]').text()).toBe('/problems/lsi/oops');
    expect(document.title).toContain('Không tìm thấy');
  });

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

  it('draws Bit crying with a spoken label, and the giant 404 is decoration', async () => {
    mockApi({ 'GET /auth/me': signedOut, 'GET /pages/nope': fail(404, 'not_found') });
    const { wrapper } = await mountApp('/nope');
    const bit = wrapper.get('[role="img"]');
    expect(bit.attributes('aria-label')).toBe('Bit đang khóc');
    expect(bit.find('[data-blinking="true"]').exists()).toBe(true); // closed eyes
    expect(bit.findAll('.bit-tear')).toHaveLength(2);
    expect(wrapper.get('[data-testid="pale-404"]').attributes('aria-hidden')).toBe('true');
  });
});
