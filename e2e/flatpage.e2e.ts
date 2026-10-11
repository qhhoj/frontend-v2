import { expect, test } from './fixtures/api';

const PAGE = '/about/rules';
const MEMBERS_ONLY = '/doi-tuyen';
const UNKNOWN = '/khong/co';
const UNAUTHORIZED = {
  status: 401,
  body: { error: { code: 'unauthorized', message: 'Unauthorized' } },
};
const NOT_FOUND = { status: 404, body: { error: { code: 'not_found', message: 'Not found' } } };
// Nowrap cells: wrapping text would shrink the table to fit the box and never overflow.

/** The typed client sends the nested path as one encoded segment: `/about/rules` -> `GET /pages/about%2Frules`. */
const pageRoute = (path: string) => `GET /pages/${encodeURIComponent(path.slice(1))}`;

test('a stored page renders with its breadcrumb and title', async ({ page, api }) => {
  api.signedIn = false;
  await page.goto(PAGE);
  await expect(page.getByRole('heading', { level: 1, name: 'Quy tắc cộng đồng' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Đường dẫn' })).toContainText('Trang chủ');
});

test('a members-only page asks a signed-out reader to sign in and comes back to it', async ({
  page,
  api,
}) => {
  api.routes[pageRoute(MEMBERS_ONLY)] = UNAUTHORIZED;
  await page.goto(MEMBERS_ONLY);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Đăng nhập để đọc trang này' }),
  ).toBeVisible();
  const signIn = page.getByRole('main').getByRole('link', { name: 'Đăng nhập' });
  await expect(signIn).toHaveAttribute('href', `/login?redirect=${MEMBERS_ONLY}`);
  await signIn.click();
  await expect(page).toHaveURL(/\/login\?redirect=/);
});

test('an unknown path shows the 404 page with the requested path', async ({ page, api }) => {
  api.routes[pageRoute(UNKNOWN)] = NOT_FOUND;
  await page.goto(UNKNOWN);
  await expect(page.getByRole('heading', { level: 1, name: 'Không tìm thấy trang' })).toBeVisible();
  await expect(page.getByTestId('requested-path')).toHaveText(UNKNOWN);
});
