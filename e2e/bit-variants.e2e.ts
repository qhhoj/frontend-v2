import { submissionDetail } from '../src/test/fixtures';
import { expect, test } from './fixtures/api';

test('a submission still being judged shows the judging Bit, decorative, and it moves', async ({
  page,
  api,
}) => {
  api.signedIn = true;
  api.routes['GET /submissions/:id'] = () => ({
    body: {
      data: submissionDetail({ status: 'G', result: null, points: null, currentTestcase: 3 }),
    },
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/submissions/sub-1');
  const judging = page.getByTestId('judging-bit');
  await expect(judging).toBeVisible();
  await expect(judging).toHaveAttribute('aria-hidden', 'true');
  await expect.poll(() => judging.getAttribute('data-frame'), { timeout: 5000 }).not.toBe('0');
});

test('under reduced motion the judging Bit stays on frame 0 and draws the same pixels', async ({
  page,
  api,
}) => {
  api.signedIn = true;
  api.routes['GET /submissions/:id'] = () => ({
    body: { data: submissionDetail({ status: 'G', result: null, points: null }) },
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/submissions/sub-1');
  const judging = page.getByTestId('judging-bit');
  await expect(judging).toBeVisible();
  const still = await judging.locator('.grid').innerHTML();
  await page.waitForTimeout(1500);
  await expect(judging).toHaveAttribute('data-frame', '0');
  expect(await judging.locator('.grid').innerHTML()).toBe(still);
});
