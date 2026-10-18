import type { Page } from '@playwright/test';
import { submissionDetail } from '../src/test/fixtures';
import { expect, test } from './fixtures/api';
import { AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { adminOk, dialogOf, signInAsStaff } from './fixtures/admin';

const FINISHED = submissionDetail({
  id: 'sub-1',
  status: 'D',
  result: 'TLE',
  viewer: {
    canAbort: false,
    canRejudge: true,
    canReject: true,
    canLock: false,
    canOverrideScore: false,
  },
});
const STAFF_PERMISSIONS = [
  'judge.rejudge_submission',
  'judge.reject_submission',
  'judge.abort_any_submission',
];
const PANEL = '[data-testid="staff-panel"]';

/** Tab until the dialog's confirm button has focus; the dialog traps focus, so this is the keyboard route in. */
async function tabToConfirm(page: Page, label: string) {
  for (let step = 0; step < 8; step++) {
    const isFocused = await page.evaluate(
      (text) => document.activeElement?.textContent?.trim() === text,
      label,
    );
    if (isFocused) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Focus never reached "${label}"`);
}

for (const viewport of AUDIT_VIEWPORTS)
  test(`staff panel at ${viewport.name}: keyboard rejudge confirms and the dialog is accessible`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    signInAsStaff(api, STAFF_PERMISSIONS);
    api.routes['GET /submissions/sub-1'] = adminOk(FINISHED);
    api.routes['POST /submissions/sub-1/rejudge'] = { status: 204 };
    await page.goto('/submissions/sub-1');
    const panel = page.locator(PANEL);
    await expect(panel).toBeVisible();
    await panel.getByRole('button', { name: 'Chấm lại', exact: true }).click();
    await expect(dialogOf(page)).toContainText('Kết quả hiện tại (TLE');
    expect(await axeViolationsIn(page)).toEqual([]);

    await tabToConfirm(page, 'Chấm lại');
    await page.keyboard.press('Enter');
    await expect(panel.getByRole('status')).toContainText('Đã gửi chấm lại.');
    await expect(dialogOf(page)).toBeHidden();
    expect(await axeViolationsIn(page)).toEqual([]);
    expect(api.requestsTo('POST /submissions/sub-1/rejudge')).toHaveLength(1);
  });

test('the owner who is not staff has no staff panel, even when the server flags abort for them', async ({
  page,
  api,
}) => {
  api.signedIn = true;
  const judging = submissionDetail({
    id: 'sub-1',
    status: 'G',
    result: null,
    viewer: {
      canAbort: true,
      canRejudge: false,
      canReject: false,
      canLock: false,
      canOverrideScore: false,
    },
  });
  api.routes['GET /submissions/sub-1'] = adminOk(judging);
  await page.goto('/submissions/sub-1');
  await expect(page.getByTestId('submission-hero')).toBeVisible();
  await expect(page.locator(PANEL)).toHaveCount(0);
});
