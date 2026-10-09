import type { Page } from '@playwright/test';
import { expect, test } from './fixtures/api';
import { AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { adminOk, dialogOf, signInAsStaff } from './fixtures/admin';

const CONFIRM_LABEL = 'Chấm lại 128 bài nộp';
const isDryRun = (body: unknown) => (body as { dryRun?: boolean }).dryRun === true;

/** Tab until the confirm button has focus (the dialog traps focus, so this is the keyboard route into it). */
async function tabToConfirm(page: Page) {
  for (let step = 0; step < 8; step++) {
    const isFocused = await page.evaluate(
      (label) => document.activeElement?.textContent?.trim() === label,
      CONFIRM_LABEL,
    );
    if (isFocused) return;
    await page.keyboard.press('Tab');
  }
  throw new Error('Focus never reached the confirm button');
}

for (const viewport of AUDIT_VIEWPORTS)
  test(`bulk rejudge at ${viewport.name}: keyboard confirm shows the queued count and is accessible`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    signInAsStaff(api, ['judge.rejudge_submission']);
    api.routes['POST /submissions/rejudge'] = ({ body }) =>
      adminOk({ count: 128, dryRun: isDryRun(body), allowed: true });
    await page.goto('/admin/rejudge');
    await page.getByLabel('Mã bài').fill('hcmus41c');
    await page.getByRole('checkbox', { name: 'WA' }).check();
    await page.getByRole('button', { name: 'Chấm lại các bài nộp này' }).click();
    await expect(dialogOf(page)).toContainText('Được phép chạy');
    await expect(dialogOf(page).getByRole('button', { name: CONFIRM_LABEL })).toBeVisible();
    expect(await axeViolationsIn(page)).toEqual([]);

    await tabToConfirm(page);
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('status').filter({ hasText: 'Đã xếp lại 128 bài nộp.' }),
    ).toBeVisible();
    await expect(dialogOf(page)).toBeHidden();
    expect(await axeViolationsIn(page)).toEqual([]);
    const sent = api
      .requestsTo('POST /submissions/rejudge')
      .map((seen) => JSON.parse(String(seen.postData)));
    expect(sent.map((body) => isDryRun(body))).toEqual([true, false]);
  });
