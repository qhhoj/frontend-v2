import type { Page } from '@playwright/test';
import { expect, test } from './fixtures/api';

const DESKTOP = { width: 1280, height: 800 };
const control = (page: Page, name: string | RegExp) =>
  page.getByRole('button', { name, exact: typeof name === 'string' });

test('the toolbar filters the list through the URL, with chips and clear all', async ({
  page,
  api,
}) => {
  void api;
  await page.setViewportSize(DESKTOP);
  await page.goto('/problems');
  await expect(page.getByRole('heading', { name: 'Bài tập', level: 1 })).toBeVisible();

  await page.getByRole('searchbox').fill('lis');
  await expect(page).toHaveURL(/search=lis/);

  await control(page, /^Dạng bài/).click();
  await page.getByRole('searchbox', { name: 'Tìm dạng bài' }).fill('quy');
  await expect(page.getByRole('checkbox')).toHaveCount(1);
  await page.getByRole('checkbox', { name: 'Quy hoạch động' }).check();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/type=/);

  await control(page, /^Lọc theo điểm/).click();
  await page.getByRole('spinbutton', { name: 'Điểm từ' }).fill('800');
  await page.getByRole('spinbutton', { name: 'Điểm đến' }).fill('2400');
  await page.getByRole('spinbutton', { name: 'Điểm đến' }).press('Tab');
  await expect(page).toHaveURL(/min=800&max=2400/);
  await page.keyboard.press('Escape');

  await page.getByRole('combobox', { name: 'Sắp xếp' }).selectOption('-points');
  await expect(page).toHaveURL(/sort=-points/);
  await expect(page.getByRole('columnheader', { name: 'Điểm' })).toHaveAttribute(
    'aria-sort',
    'descending',
  );

  await expect(control(page, 'Bỏ lọc: 800–2400 điểm')).toBeVisible();
  await control(page, 'Bỏ lọc: 800–2400 điểm').click();
  await expect(page).not.toHaveURL(/min=/);

  await page.goBack();
  await expect(page).toHaveURL(/min=800&max=2400/);

  await control(page, 'Xóa tất cả').click();
  await expect(page).not.toHaveURL(/type=|search=|min=/);
  await expect(page).toHaveURL(/sort=-points/);
});

test('hiding solved problems needs a signed-in viewer', async ({ page, api }) => {
  await page.goto('/problems');
  await expect(control(page, 'Ẩn bài đã giải')).toBeDisabled();
  api.signedIn = true;
  await page.reload();
  const hide = control(page, 'Ẩn bài đã giải');
  await hide.click();
  await expect(hide).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL(/unsolved=1/);
  const requested = api.requests.filter((request) => request.key === 'GET /problems');
  expect(requested.at(-1)!.url.searchParams.get('solved')).toBe('false');
});

test('the random button opens a problem under the current filters', async ({ page, api }) => {
  await page.goto('/problems?editorial=1');
  await control(page, 'Bài ngẫu nhiên').click();
  await expect(page).toHaveURL(/\/problems\/duongdi$/);
  const asked = api.requests.find((request) => request.key === 'GET /problems/random')!;
  expect(asked.url.searchParams.get('hasEditorial')).toBe('true');
});

test('the random button says when nothing matches and stays on the list', async ({ page, api }) => {
  api.routes['GET /problems/random'] = {
    status: 404,
    body: { error: { code: 'no_problem', message: 'No matching problem' } },
  };
  await page.goto('/problems');
  await control(page, 'Bài ngẫu nhiên').click();
  await expect(
    page.getByTestId('random-status').filter({ hasText: 'Không có bài phù hợp.' }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/problems$/);
});
