import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  getData,
  PYTHON_SUM,
  SEEDED,
  signIn,
  signOut,
  submitSource,
  uniqueName,
  VERDICT_LABELS,
  waitForEmptyQueue,
} from './support';

const LIVE = SEEDED.liveContest;

async function createProblem(page: Page, code: string, name: string) {
  await page.goto('/admin/problems/new');
  await page.getByLabel('Mã bài', { exact: true }).fill(code);
  await page.getByLabel('Tên bài', { exact: true }).fill(name);
  await page.getByLabel('Chọn loại bài').selectOption({ label: 'Uncategorized' });
  await page.getByRole('button', { name: 'Thêm loại' }).click();
  await page.getByRole('button', { name: 'Tạo bài' }).click();
}

test.describe('J6 admin', () => {
  test('a regular user is kept out of the admin area', async ({ page }) => {
    await signIn(page, 'user');
    await page.goto('/admin/problems');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Không tìm thấy trang' }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/problems$/);
  });

  test('creates a problem the editor can read back', async ({ page }) => {
    await signIn(page, 'admin');
    const code = uniqueName('smoke').toLowerCase();
    await createProblem(page, code, `Smoke ${code}`);
    await expect(page).toHaveURL(new RegExp(`/admin/problems/${code}`));
    const stored = await getData<{ code: string; name: string }>(page, `/problems/${code}`);
    expect(stored.name).toBe(`Smoke ${code}`);
    await expect(page.getByLabel('Tên bài', { exact: true })).toHaveValue(`Smoke ${code}`);
  });

  test('the seeded test-data archive shows as the case files the data tab lists', async ({
    page,
  }) => {
    await signIn(page, 'admin');
    const data = await getData<{ archive: string; archiveFiles: string[] }>(
      page,
      '/problems/e2e_max/data',
    );
    expect(data.archive).toBe('tests.zip');
    expect([...data.archiveFiles].sort()).toEqual(['1.in', '1.out', '2.in', '2.out']);
    await page.goto('/admin/problems/e2e_max/data');
    await expect(page.getByText('tests.zip').first()).toBeVisible();
    for (const file of data.archiveFiles) await expect(page.getByText(file).first()).toBeVisible();
  });

  test('a contest edit shows on the public contest page', async ({ page }) => {
    await signIn(page, 'admin');
    const title = `E2E Live Round ${uniqueName('t')}`;
    await page.goto(`/admin/contests/${LIVE}/general`);
    await page.getByLabel('Tên kỳ thi').fill(title);
    await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(page.getByText('Đã lưu.')).toBeVisible();
    await page.goto(`/contests/${LIVE}`);
    await expect(page.getByRole('heading', { name: title }).first()).toBeVisible();

    await page.goto(`/admin/contests/${LIVE}/problems`);
    await expect(page.getByText('e2e_sum').first()).toBeVisible();
    await expect(page.getByText('e2e_max').first()).toBeVisible();
  });

  test('rejudging a problem re-grades its submissions through the judge', async ({ page }) => {
    test.setTimeout(180_000);
    await signIn(page, 'user');
    await waitForEmptyQueue(page);
    const id = await submitSource(page, 'e2e_sum', PYTHON_SUM);
    await expect(page.getByTestId('submission-summary')).toContainText(VERDICT_LABELS.AC, {
      timeout: 60_000,
    });
    await signOut(page);
    await signIn(page, 'admin');
    await page.goto('/admin/rejudge');
    await page.getByLabel('Mã bài', { exact: true }).fill('e2e_sum');
    await page.getByRole('button', { name: 'Chấm lại các bài nộp này' }).click();
    const dialog = page.getByRole('dialog');
    const confirm = dialog.getByRole('button', { name: /^Chấm lại( \d+ bài nộp)?$/ });
    await expect(dialog.getByRole('button', { name: /^Chấm lại \d+ bài nộp$/ })).toBeVisible();
    const clickedAt = Date.now();
    await confirm.click();
    await expect(page.getByText(/Đã xếp lại \d+ bài nộp/)).toBeVisible();
    await expect
      .poll(
        async () => {
          const s = await getData<{ status: string; judgedDate: string | null }>(
            page,
            `/submissions/${id}`,
          );
          return s.status === 'D' && s.judgedDate !== null && Date.parse(s.judgedDate) > clickedAt;
        },
        { timeout: 60_000 },
      )
      .toBe(true);
    // The bulk rejudge requeued every e2e_sum row; leave the queue empty for the next journey.
    await waitForEmptyQueue(page);
  });
});
