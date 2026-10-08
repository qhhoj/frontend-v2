import { flushPromises } from '@vue/test-utils';
import { expect, it } from 'vitest';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import { organizationSummary } from '@/test/community-fixtures';
import { sessionUser, userPage } from '@/test/fixtures';
import { profileRoutes } from '@/test/community-routes';
import { fail, mockApi, noContent } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, signedInViewer } from '@/test/problem-routes';

const other = userPage({
  username: 'ngoc_anh',
  displayName: 'Ngọc Anh',
  rating: 1812,
  organizations: [organizationSummary()],
});
const viewerWith = (permissions: string[]) =>
  signedInViewer({ user: sessionUser({ permissions }) });

it('marks the viewer’s own profile and offers its two actions', async () => {
  mockApi({ ...signedInViewer(), ...profileRoutes() });
  const { wrapper } = await mountApp('/users/user_01');
  const header = wrapper.get('[data-testid="profile-header"]');
  expect(header.text()).toContain('Hồ sơ của bạn');
  expect(header.get('a[href="/settings"]').text()).toBe('Chỉnh sửa hồ sơ');
  expect(header.get('a[href="/blog/new"]').text()).toBe('Viết bài');
  expect(header.findComponent(UserAvatar).exists()).toBe(true);
});

it('shows another user’s profile without those actions, with tier, school chip and tab links', async () => {
  mockApi({ ...anonymousViewer, ...profileRoutes(other) });
  const { wrapper } = await mountApp('/users/ngoc_anh');
  const header = wrapper.get('[data-testid="profile-header"]');
  expect(header.text()).not.toContain('Hồ sơ của bạn');
  expect(header.text()).toContain('Expert');
  expect(header.get('a[href="/organizations/lhp"]').text()).toBe('LHP');
  const tabs = wrapper
    .get('nav[aria-label="Mục hồ sơ"]')
    .findAll('a')
    .map((link) => link.text());
  expect(tabs).toEqual(['Tổng quan', 'Bài đã giải', 'Điểm PP', 'Bài viết']);
  expect(document.title).toContain('ngoc_anh');
});

it('adds the comments tab for viewers allowed to list a user’s comments', async () => {
  mockApi({ ...viewerWith(['judge.view_all_user_comment']), ...profileRoutes(other) });
  const { wrapper } = await mountApp('/users/ngoc_anh');
  expect(wrapper.get('nav[aria-label="Mục hồ sơ"]').text()).toContain('Bình luận');
});

it('shows the crying Bit and the name for an unknown user', async () => {
  mockApi({ ...anonymousViewer, 'GET /users/nguoi_la': fail(404, 'not_found') });
  const { wrapper } = await mountApp('/users/nguoi_la');
  const state = wrapper.get('[data-state="notFound"]');
  expect(state.get('h1').text()).toBe('Không tìm thấy người dùng');
  expect(state.text()).toContain('“nguoi_la”');
});

it('bans with a reason for a viewer holding judge.ban_user, then shows the crowned success', async () => {
  const calls = mockApi({
    ...viewerWith(['judge.ban_user']),
    ...profileRoutes(other),
    'POST /users/ngoc_anh/ban': noContent(),
  });
  const { wrapper } = await mountApp('/users/ngoc_anh');
  await wrapper.get('button[data-testid="ban-open"]').trigger('click');
  await flushPromises();
  const dialog = document.querySelector('[role="dialog"]')!;
  const reason = dialog.querySelector('textarea')!;
  reason.value = 'Nộp bài giống hệt tài khoản khác.';
  reason.dispatchEvent(new Event('input'));
  await flushPromises();
  (dialog.querySelector('form') as HTMLFormElement).dispatchEvent(
    new Event('submit', { cancelable: true }),
  );
  await flushPromises();
  expect(calls.find((call) => call.path === '/users/ngoc_anh/ban')!.body).toEqual({
    reason: 'Nộp bài giống hệt tài khoản khác.',
  });
  expect(wrapper.get('[data-state="success"]').text()).toContain('Đã cấm ngoc_anh');
});
it('keeps the ban disabled for a blank reason and sends nothing', async () => {
  const calls = mockApi({
    ...viewerWith(['judge.ban_user']),
    ...profileRoutes(other),
    'POST /users/ngoc_anh/ban': noContent(),
  });
  const { wrapper } = await mountApp('/users/ngoc_anh');
  await wrapper.get('button[data-testid="ban-open"]').trigger('click');
  await flushPromises();
  const dialog = document.querySelector('[role="dialog"]')!;
  const reason = dialog.querySelector('textarea')!;
  reason.value = '   ';
  reason.dispatchEvent(new Event('input'));
  await flushPromises();
  const submit = [...dialog.querySelectorAll('button')].find((button) => button.type === 'submit')!;
  expect(submit.getAttribute('aria-disabled')).toBe('true');
  (dialog.querySelector('form') as HTMLFormElement).dispatchEvent(
    new Event('submit', { cancelable: true }),
  );
  await flushPromises();
  expect(calls.some((call) => call.method === 'POST')).toBe(false);
});
