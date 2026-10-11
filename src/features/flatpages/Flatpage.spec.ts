import { describe, expect, it } from 'vitest';
import { fail, mockApi } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';

describe('flatpages', () => {
  it('asks a signed-out reader of a members-only page to sign in and come back', async () => {
    mockApi({ ...anonymousViewer, 'GET /pages/doi-tuyen': fail(401, 'unauthorized') });
    const { wrapper } = await mountApp('/doi-tuyen');
    const state = wrapper.get('[data-state="signIn"]');
    expect(state.get('h1').text()).toBe('Đăng nhập để đọc trang này');
    expect(state.get('a').attributes('href')).toBe('/login?redirect=/doi-tuyen');
  });
});
