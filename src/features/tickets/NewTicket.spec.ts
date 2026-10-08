import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { problemDetail } from '@/test/fixtures';
import { ticketDetail } from '@/test/community-fixtures';
import { fail, mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { signedInViewer } from '@/test/problem-routes';

describe('new ticket: prefill and filing', () => {
  it('prefills the problem from the URL, names it, and files the ticket on that problem', async () => {
    const calls = mockApi({
      ...signedInViewer(),
      'GET /problems/hcmus41b': ok(problemDetail({ code: 'hcmus41b', name: 'Trò chơi trên cây' })),
      'POST /problems/hcmus41b/tickets': ok(ticketDetail()),
      [`GET /tickets/${ticketDetail().id}`]: ok(ticketDetail()),
    });
    const { wrapper, router } = await mountApp('/tickets/new?problem=hcmus41b');
    await flushPromises();
    expect(wrapper.text()).toContain('Bài: Trò chơi trên cây');
    await wrapper.get('input[name="title"]').setValue(' Test 17 sai ');
    await wrapper.get('textarea[name="body"]').setValue('Đáp án mẫu in ra 1.');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(calls.find((call) => call.method === 'POST')!.body).toEqual({
      title: 'Test 17 sai',
      body: 'Đáp án mẫu in ra 1.',
    });
    await vi.waitFor(() =>
      expect(router.currentRoute.value.path).toBe(`/tickets/${ticketDetail().id}`),
    );
  });
});

describe('new ticket: general issue', () => {
  it('files a general issue with its link', async () => {
    const calls = mockApi({
      ...signedInViewer(),
      'POST /tickets/general': ok(ticketDetail()),
      [`GET /tickets/${ticketDetail().id}`]: ok(ticketDetail()),
    });
    const { wrapper } = await mountApp('/tickets/new');
    await wrapper.get('input[type="radio"][value="general"]').setValue(true);
    await wrapper.get('input[name="issueUrl"]').setValue('https://qhhoj.vn/contests/r42');
    await wrapper.get('input[name="title"]').setValue('Điểm sai');
    await wrapper.get('textarea[name="body"]').setValue('Bảng điểm hiển thị sai.');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(calls.find((call) => call.path === '/tickets/general')!.body).toEqual({
      title: 'Điểm sai',
      body: 'Bảng điểm hiển thị sai.',
      issueUrl: 'https://qhhoj.vn/contests/r42',
    });
  });
});

describe('new ticket validation and failures', () => {
  it('blocks an incomplete draft without a request and points at each field', async () => {
    const calls = mockApi({ ...signedInViewer() });
    const { wrapper } = await mountApp('/tickets/new');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
    expect(wrapper.get('input[name="title"]').attributes('aria-invalid')).toBe('true');
  });
  it('explains a muted account with the sweating Bit', async () => {
    mockApi({ ...signedInViewer(), 'POST /tickets/general': fail(403, 'forbidden') });
    const { wrapper } = await mountApp('/tickets/new');
    await wrapper.get('input[type="radio"][value="general"]').setValue(true);
    await wrapper.get('input[name="issueUrl"]').setValue('https://qhhoj.vn');
    await wrapper.get('input[name="title"]').setValue('T');
    await wrapper.get('textarea[name="body"]').setValue('B');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.get('[data-state="error"]').text()).toContain('Tài khoản đang bị tắt tiếng');
  });
  it('tells the viewer when the problem code names no problem, and sends nothing for it', async () => {
    const calls = mockApi({
      ...signedInViewer(),
      'GET /problems/nope': fail(404, 'not_found'),
      'POST /problems/nope/tickets': fail(404, 'not_found'),
    });
    const { wrapper } = await mountApp('/tickets/new?problem=nope');
    await flushPromises();
    await wrapper.get('input[name="title"]').setValue('T');
    await wrapper.get('textarea[name="body"]').setValue('B');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(calls.find((call) => call.method === 'POST')!.path).toBe('/problems/nope/tickets');
    expect(wrapper.get('input[name="problemCode"]').attributes('aria-invalid')).toBe('true');
    expect(wrapper.get('#problemCode-error').text()).toContain('Không tìm thấy bài nope');
  });
});
