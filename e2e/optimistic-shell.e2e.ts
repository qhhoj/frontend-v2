import type { Page } from '@playwright/test';
import { expect, test } from './fixtures/api';

/** D-08: until `/auth/me` answers, the shell and a page skeleton show, but nothing that depends on who is signed in. */
const SKELETON = '[data-testid="pending-page-skeleton"]';
const PLACEHOLDER = '[data-testid="account-placeholder"]';
const SIGN_IN_LINKS = 'a[href^="/login"], a[href^="/register"]';

/** Records, from the first paint on, whether a sign-in or register link was ever in the document. */
async function watchForSignedOutLinks(page: Page) {
  await page.addInitScript((selector) => {
    const seen = { signedOut: false };
    Object.assign(window, { __seen: seen });
    new MutationObserver(() => {
      if (document.querySelector(selector)) seen.signedOut = true;
    }).observe(document, { childList: true, subtree: true, attributes: true });
  }, SIGN_IN_LINKS);
}
const sawSignedOutLinks = (page: Page) =>
  page.evaluate(() => (window as unknown as { __seen: { signedOut: boolean } }).__seen.signedOut);

test('while the session is pending a page shows the shell and its skeleton, and loads no data yet', async ({
  page,
  api,
}) => {
  const release = api.hold('GET /auth/me');
  await page.goto('/problems');
  await expect(page.locator(SKELETON)).toBeVisible();
  await expect(page.getByRole('banner').locator(PLACEHOLDER)).toBeVisible();
  await expect(page.getByRole('banner').getByRole('link', { name: 'Đăng nhập' })).toHaveCount(0);
  expect(api.requestsTo('GET /problems')).toHaveLength(0);
  release();
  await expect(page.getByText('Đường đi ngắn nhất').first()).toBeVisible();
  await expect(page.locator(SKELETON)).toHaveCount(0);
  await expect(page.getByRole('banner').getByRole('link', { name: 'Đăng nhập' })).toBeVisible();
});

test('a signed-in viewer never sees the signed-out header or home while the session loads', async ({
  page,
  api,
}) => {
  api.signedIn = true;
  await watchForSignedOutLinks(page);
  const release = api.hold('GET /auth/me');
  await page.goto('/');
  await expect(page.locator(SKELETON)).toBeVisible();
  release();
  await expect(page.getByRole('button', { name: 'Tài khoản của user_01' })).toBeVisible();
  expect(await sawSignedOutLinks(page)).toBe(false);
});

test('a protected page shows nothing of itself before the session answers, then opens', async ({
  page,
  api,
}) => {
  api.signedIn = true;
  const release = api.hold('GET /auth/me');
  await page.goto('/settings');
  await expect(page.locator(SKELETON)).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Tên hiển thị' })).toHaveCount(0);
  expect(api.requestsTo('GET /profile')).toHaveLength(0);
  release();
  await expect(page.getByRole('textbox', { name: 'Tên hiển thị' })).toBeVisible();
});

test('a guest sent to a protected page lands on sign-in once the session answers', async ({
  page,
  api,
}) => {
  const release = api.hold('GET /auth/me');
  await page.goto('/settings');
  await expect(page.locator(SKELETON)).toBeVisible();
  release();
  await expect(page).toHaveURL(/\/login\?redirect=/);
});

test('the admin area stays empty until the session answers, then refuses a viewer who is not staff', async ({
  page,
  api,
}) => {
  api.signedIn = true;
  const release = api.hold('GET /auth/me');
  await page.goto('/admin');
  await expect(page.getByRole('banner').locator(PLACEHOLDER)).toBeVisible();
  await expect(page.locator(SKELETON)).toHaveCount(0);
  await expect(page.getByTestId('admin-nav')).toHaveCount(0);
  release();
  await expect(page.getByTestId('pale-404')).toBeVisible();
  await expect(page.getByTestId('admin-nav')).toHaveCount(0);
});
