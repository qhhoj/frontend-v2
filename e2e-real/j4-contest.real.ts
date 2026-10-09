import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  CREDENTIALS,
  getData,
  postData,
  PYTHON_SUM,
  SEEDED,
  signIn,
  submitSource,
  VERDICT_LABELS,
  waitForEmptyQueue,
} from './support';

const LIVE = SEEDED.liveContest;
const { username } = CREDENTIALS.user;

interface Ranking {
  rows: Array<{ user: { username: string }; score: number }>;
}

const userScore = async (page: Page) =>
  (await getData<Ranking>(page, `/contests/${LIVE}/ranking`)).rows.find(
    (row) => row.user.username === username,
  )?.score;

test.describe('J4 contest', () => {
  test.afterAll(async ({ browser }, testInfo) => {
    // A failed run must not leave the user inside the contest: J3's next submissions would count as contest ones.
    const page = await browser.newPage({ baseURL: testInfo.project.use.baseURL });
    await signIn(page);
    await postData(page, `/contests/${LIVE}/leave`).catch(() => undefined);
    await page.close();
  });

  test('the contest list shows the running and the ended contest', async ({ page }) => {
    await page.goto('/contests');
    await expect(page.getByText('E2E Live Round').first()).toBeVisible();
    await expect(page.getByText('E2E Past Round').first()).toBeVisible();
  });

  test('join the running contest, solve a problem inside it, see it on the scoreboard', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await signIn(page);
    await waitForEmptyQueue(page);
    await page.goto(`/contests/${LIVE}`);
    await page.getByRole('button', { name: /Vào thi|Quay lại kỳ thi/ }).click();
    await expect(page.getByTestId('participation-status')).toHaveText('Bạn đã vào kỳ thi.');

    await submitSource(page, 'e2e_sum', PYTHON_SUM);
    await expect(page.getByTestId('submission-summary')).toContainText(VERDICT_LABELS.AC, {
      timeout: 60_000,
    });
    await expect.poll(() => userScore(page), { timeout: 60_000 }).toBe(100);

    await page.goto(`/contests/${LIVE}/ranking`);
    const row = page.getByRole('row', { name: new RegExp(username) });
    await expect(row.getByRole('cell').nth(1)).toHaveText('1');
  });

  test('leaving the contest keeps the score on the scoreboard', async ({ page }) => {
    await signIn(page);
    await page.goto(`/contests/${LIVE}`);
    await page.getByRole('button', { name: 'Rời kỳ thi' }).click();
    await expect(page.getByTestId('participation-status')).toHaveText('Bạn đã rời kỳ thi.');
    expect(await userScore(page)).toBe(100);
    await page.goto(`/contests/${LIVE}/ranking`);
    await expect(page.getByRole('row', { name: new RegExp(username) })).toBeVisible();
  });

  test('an admin sees the same ranking the participant has', async ({ page }) => {
    await signIn(page, 'admin');
    await page.goto(`/contests/${LIVE}/ranking`);
    await expect(page.getByRole('row', { name: new RegExp(username) })).toBeVisible();
  });
});
