import { flushPromises } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { userPage as makeUser } from '@/test/fixtures';
import { organizationSummary } from '@/test/community-fixtures';
import { sessionUser, userPage } from '@/test/fixtures';
import { profileRoutes } from '@/test/community-routes';
import { fail, mockApi, noContent, ok } from '@/test/mock-api';
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

it('adds the comments tab for viewers allowed to list a user’s comments', async () => {
  mockApi({ ...viewerWith(['judge.view_all_user_comment']), ...profileRoutes(other) });
  const { wrapper } = await mountApp('/users/ngoc_anh');
  expect(wrapper.get('nav[aria-label="Mục hồ sơ"]').text()).toContain('Bình luận');
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

const openBanDialog = async (wrapper: {
  get: (selector: string) => { trigger: (event: string) => Promise<unknown> };
}) => {
  await wrapper.get('button[data-testid="ban-open"]').trigger('click');
  await flushPromises();
  return document.querySelector('[role="dialog"]')!;
};
const typeReason = async (dialog: Element, text: string) => {
  const reason = dialog.querySelector('textarea')!;
  reason.value = text;
  reason.dispatchEvent(new Event('input'));
  await flushPromises();
};
const submitDialog = (dialog: Element) =>
  (dialog.querySelector('form') as HTMLFormElement).dispatchEvent(
    new Event('submit', { cancelable: true }),
  );
const buttonIn = (dialog: Element, type: string) =>
  dialog.querySelector(`button[type="${type}"]`) as HTMLButtonElement;
const cancelIn = (dialog: Element) =>
  [...dialog.querySelectorAll('button')].find((button) => button.type !== 'submit')!;

it('shows no ban opener to anonymous visitors', async () => {
  mockApi({ ...anonymousViewer, ...profileRoutes(other) });
  const { wrapper } = await mountApp('/users/ngoc_anh');
  expect(wrapper.find('[data-testid="ban-open"]').exists()).toBe(false);
});

it('shows no ban opener to a signed-in viewer without judge.ban_user', async () => {
  mockApi({ ...signedInViewer(), ...profileRoutes(other) });
  const { wrapper } = await mountApp('/users/ngoc_anh');
  expect(wrapper.find('[data-testid="ban-open"]').exists()).toBe(false);
});

it('shows no ban opener on the viewer’s own profile, even with judge.ban_user', async () => {
  mockApi({ ...viewerWith(['judge.ban_user']), ...profileRoutes() });
  const { wrapper } = await mountApp('/users/user_01');
  expect(wrapper.find('[data-testid="ban-open"]').exists()).toBe(false);
  expect(wrapper.get('[data-testid="profile-header"]').find('a[href="/settings"]').exists()).toBe(
    true,
  );
});

it('shows no ban opener for a superuser target, and says nothing about a ban', async () => {
  const superuser = makeUser({
    username: 'thayhung',
    staff: { isSuperuser: true, isActive: true, banReason: null },
  });
  mockApi({ ...viewerWith(['judge.ban_user']), ...profileRoutes(superuser) });
  const { wrapper } = await mountApp('/users/thayhung');
  expect(wrapper.find('[data-testid="ban-open"]').exists()).toBe(false);
  expect(wrapper.find('[data-testid="ban-status"]').exists()).toBe(false);
});

const bannedOther = () =>
  makeUser({
    ...other,
    displayRank: 'banned',
    staff: { isSuperuser: false, isActive: false, banReason: 'Nộp bài giống hệt.' },
  });

it('shows an already-banned target with its reason and an unban opener instead of the ban', async () => {
  mockApi({ ...viewerWith(['judge.ban_user']), ...profileRoutes(bannedOther()) });
  const { wrapper } = await mountApp('/users/ngoc_anh');
  expect(wrapper.find('[data-testid="ban-open"]').exists()).toBe(false);
  expect(wrapper.get('[data-testid="ban-status"]').text()).toContain('Nộp bài giống hệt.');
  expect(wrapper.get('button[data-testid="unban-open"]').text()).toBe('Bỏ cấm');
});

it('shows no PP rank for a banned account even when the API still sends one', async () => {
  mockApi({ ...signedInViewer(), ...profileRoutes({ ...bannedOther(), rank: 4 }) });
  const { wrapper } = await mountApp('/users/ngoc_anh');
  const stats = wrapper.get('[data-testid="profile-stats"]').text();
  expect(stats).not.toContain('#4');
  expect(stats).toContain('—');
});

it('shows no unban opener to a viewer without judge.ban_user', async () => {
  mockApi({ ...signedInViewer(), ...profileRoutes(bannedOther()) });
  const { wrapper } = await mountApp('/users/ngoc_anh');
  expect(wrapper.find('[data-testid="unban-open"]').exists()).toBe(false);
});

it('unbans only after confirming, then refetches the profile and offers the ban again', async () => {
  let isBanned = true;
  const calls = mockApi({
    ...viewerWith(['judge.ban_user']),
    ...profileRoutes(other),
    'GET /users/ngoc_anh': () => ok(isBanned ? bannedOther() : other),
    'POST /users/ngoc_anh/unban': () => {
      isBanned = false;
      return noContent();
    },
  });
  const { wrapper } = await mountApp('/users/ngoc_anh');
  await wrapper.get('button[data-testid="unban-open"]').trigger('click');
  await flushPromises();
  expect(calls.some((call) => call.path.endsWith('/unban'))).toBe(false);
  submitDialog(document.querySelector('[role="dialog"]')!);
  await flushPromises();
  expect(calls.filter((call) => call.path === '/users/ngoc_anh/unban')).toHaveLength(1);
  await vi.waitFor(() => expect(wrapper.find('[data-testid="ban-open"]').exists()).toBe(true));
  expect(wrapper.find('[data-testid="ban-status"]').exists()).toBe(false);
  expect(document.body.textContent).toContain('Đã bỏ cấm ngoc_anh.');
});

it('keeps the ban of one profile off a cached next profile', async () => {
  const next = makeUser({ username: 'thayhung', displayName: 'Thầy Hùng', rating: 2000 });
  mockApi({
    ...viewerWith(['judge.ban_user']),
    ...profileRoutes(other),
    ...profileRoutes(next),
    'POST /users/ngoc_anh/ban': noContent(),
  });
  const { wrapper, router } = await mountApp('/users/thayhung');
  await router.push('/users/ngoc_anh');
  await flushPromises();
  const dialog = await openBanDialog(wrapper);
  await typeReason(dialog, 'Gian lận.');
  submitDialog(dialog);
  await flushPromises();
  expect(wrapper.get('[data-state="success"]').text()).toContain('Đã cấm ngoc_anh');
  await router.push('/users/thayhung');
  await flushPromises();
  expect(wrapper.get('[data-testid="profile-header"]').text()).toContain('Thầy Hùng');
  expect(wrapper.find('[data-state="success"]').exists()).toBe(false);
  expect(wrapper.get('[data-testid="ban-open"]').text()).toBe('Cấm người dùng');
});

it('while the ban is in flight, confirm and cancel are disabled and a second submit sends nothing', async () => {
  const posts: string[] = [];
  mockApi({ ...viewerWith(['judge.ban_user']), ...profileRoutes(other) });
  const answer = globalThis.fetch;
  vi.stubGlobal('fetch', (input: string, init?: RequestInit) => {
    if (init?.method === 'POST') {
      posts.push(String(input));
      return new Promise<Response>(() => {});
    }
    return answer(input, init);
  });
  try {
    const { wrapper } = await mountApp('/users/ngoc_anh');
    const dialog = await openBanDialog(wrapper);
    await typeReason(dialog, 'Gian lận.');
    submitDialog(dialog);
    await flushPromises();
    submitDialog(dialog);
    await flushPromises();
    expect(posts).toHaveLength(1);
    expect(buttonIn(dialog, 'submit').getAttribute('aria-disabled')).toBe('true');
    expect(cancelIn(dialog).getAttribute('aria-disabled')).toBe('true');
  } finally {
    vi.unstubAllGlobals();
  }
});

it('shows a failed ban inside the dialog and keeps the dialog open', async () => {
  mockApi({
    ...viewerWith(['judge.ban_user']),
    ...profileRoutes(other),
    'POST /users/ngoc_anh/ban': fail(403, 'forbidden'),
  });
  const { wrapper } = await mountApp('/users/ngoc_anh');
  const dialog = await openBanDialog(wrapper);
  await typeReason(dialog, 'Gian lận.');
  submitDialog(dialog);
  await flushPromises();
  const alert = dialog.querySelector('[role="alert"]');
  expect(alert?.textContent?.trim()).toBeTruthy();
  expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  expect(wrapper.find('[data-state="success"]').exists()).toBe(false);
});

it('moves the URL to the current name when an old, renamed username is opened', async () => {
  mockApi({
    ...anonymousViewer,
    ...profileRoutes(other),
    // The old name answers with the same, renamed user.
    ...Object.fromEntries(
      Object.entries(profileRoutes(other)).map(([key, answer]) => [
        key.replace('/ngoc_anh', '/ngoc_anh_old'),
        answer,
      ]),
    ),
  });
  const { router } = await mountApp('/users/ngoc_anh_old?tab=x');
  await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/users/ngoc_anh?tab=x'));
});

it('leads the rating box with the problems solved until the user has a rating (Q-03 B)', async () => {
  mockApi({ ...anonymousViewer, ...profileRoutes(userPage({ problemCount: 1234 })) });
  const rated = await mountApp('/users/user_01');
  await flushPromises();
  const ratedBox = rated.wrapper.get('[data-testid="rating-box"]');
  expect([
    ratedBox.text().startsWith('Rating'),
    ratedBox.get('[data-testid="rating-figure"]').text(),
  ]).toEqual([true, '2104']);
  rated.wrapper.unmount();

  mockApi({
    ...anonymousViewer,
    ...profileRoutes(userPage({ rating: null, problemCount: 1234 })),
  });
  const { wrapper } = await mountApp('/users/user_01');
  await flushPromises();
  const box = wrapper.get('[data-testid="rating-box"]');
  expect(box.text()).toContain('Đã giải');
  expect(box.get('[data-testid="rating-figure"]').text()).toBe('1.234');
  expect(box.text()).not.toContain('Cao nhất');
});
