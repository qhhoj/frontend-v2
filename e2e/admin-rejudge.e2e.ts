import type { Page } from '@playwright/test';
import { expect, test } from './fixtures/api';
import { AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { adminOk, dialogOf, signInAsStaff } from './fixtures/admin';

const CONFIRM_LABEL = 'Xác nhận chấm lại';

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
    api.routes['POST /submissions/rejudge'] = adminOk({ count: 128, dryRun: false, allowed: true });
    await page.goto('/admin/rejudge');
    await page.getByLabel('Mã bài').fill('hcmus41c');
    await page.getByRole('checkbox', { name: 'WA' }).check();
    await page.getByRole('button', { name: 'Chấm lại các bài nộp này' }).click();
    await expect(dialogOf(page)).toContainText('Số bài nộp khớp sẽ được báo sau khi xác nhận.');
    expect(await axeViolationsIn(page)).toEqual([]);

    await tabToConfirm(page);
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('status').filter({ hasText: 'Đã xếp lại 128 bài nộp.' }),
    ).toBeVisible();
    await expect(dialogOf(page)).toBeHidden();
    expect(await axeViolationsIn(page)).toEqual([]);
    expect(api.requestsTo('POST /submissions/rejudge')).toHaveLength(1);
  });
