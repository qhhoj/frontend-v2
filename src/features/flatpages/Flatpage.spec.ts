import { describe, expect, it } from 'vitest';
import { flatpage } from '@/test/community-fixtures';
import { fail, mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, signedInViewer } from '@/test/problem-routes';

describe('flatpages', () => {
  it('renders a stored page on its own path with breadcrumb, title and tab title', async () => {
    mockApi({ ...anonymousViewer, 'GET /pages/about%2Frules': ok(flatpage()) });
    const { wrapper } = await mountApp('/about/rules');
    expect(wrapper.get('h1').text()).toBe('Quy tắc cộng đồng');
    expect(wrapper.get('nav[aria-label="Đường dẫn"]').text()).toContain('Trang chủ');
    expect(wrapper.text()).toContain('Không nộp lời giải chép.');
    expect(document.title).toContain('Quy tắc cộng đồng');
  });
  it('asks a signed-out reader of a members-only page to sign in and come back', async () => {
    mockApi({ ...anonymousViewer, 'GET /pages/doi-tuyen': fail(401, 'unauthorized') });
    const { wrapper } = await mountApp('/doi-tuyen');
    const state = wrapper.get('[data-state="signIn"]');
    expect(state.get('h1').text()).toBe('Đăng nhập để đọc trang này');
    expect(state.get('a').attributes('href')).toBe('/login?redirect=/doi-tuyen');
  });
  it('falls back to the crying-Bit 404 page with the requested path', async () => {
    mockApi({ ...signedInViewer(), 'GET /pages/khong%2Fco': fail(404, 'not_found') });
    const { wrapper } = await mountApp('/khong/co');
    expect(wrapper.get('h1').text()).toBe('Không tìm thấy trang');
    expect(wrapper.get('[data-testid="requested-path"]').text()).toBe('/khong/co');
    expect(wrapper.findAll('.bit-tear')).toHaveLength(2);
  });
});
