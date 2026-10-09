import type { Page } from '@playwright/test';
import { expect, test } from './fixtures/api';
import { AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { adminOk, confirmInDialog, dialogOf, signInAsStaff } from './fixtures/admin';
import { JUDGE_FLEET } from '../src/test/admin-fixtures/judges';

const PERMISSIONS = ['judge.change_judge'];
const KEY = 'k7Qm2xV9aR4tLw0ZpB8sNf3YcHu5JdEe6GiTo1XvMqA=';

/** The key dialog, found by the key it shows: the rotation's confirm dialog may still be leaving beside it. */
const keyDialog = (page: Page) => page.getByRole('dialog').filter({ hasText: KEY });

const fitsWidth = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

/** Tab until `isTarget` matches the focused element (the dialog traps focus, so this is the keyboard route in). */
async function tabUntil(page: Page, isTarget: () => boolean) {
  for (let step = 0; step < 8; step++) {
    if (await page.evaluate(isTarget)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error('Focus never reached the target');
}

for (const viewport of AUDIT_VIEWPORTS)
  test(`judges board at ${viewport.name}: stats, rows and actions are accessible and fit`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    signInAsStaff(api, PERMISSIONS);
    api.routes['GET /judges'] = adminOk(JUDGE_FLEET);
    await page.goto('/admin/judges');
    await expect(page.getByTestId('judge-stats')).toContainText('3 / 5');
    await expect(page.getByTestId('judge-row')).toHaveCount(5);
    expect(await axeViolationsIn(page)).toEqual([]);
    expect(await fitsWidth(page)).toBe(true);
  });

for (const viewport of AUDIT_VIEWPORTS)
  test(`add judge at ${viewport.name} is accessible and fits`, async ({ page, api }) => {
    await page.setViewportSize(viewport);
    signInAsStaff(api, PERMISSIONS);
    api.routes['GET /judges'] = adminOk(JUDGE_FLEET);
    await page.goto('/admin/judges/new');
    await expect(page.getByLabel('Tên máy (khớp id khi máy chấm kết nối)')).toBeVisible();
    expect(await axeViolationsIn(page)).toEqual([]);
    expect(await fitsWidth(page)).toBe(true);
  });

test('a rotated key stays up until it is saved: Escape does not close it, Tab reaches the checkbox then Đóng', async ({
  page,
  api,
}) => {
  signInAsStaff(api, PERMISSIONS);
  api.routes['GET /judges'] = adminOk(JUDGE_FLEET);
  api.routes['POST /judges/qhh-judge-02/key'] = adminOk({ authKey: KEY });
  await page.goto('/admin/judges');
  await page
    .getByTestId('judge-row')
    .filter({ hasText: 'qhh-judge-02' })
    .getByRole('button', { name: 'Khoá', exact: true })
    .click();
  await confirmInDialog(page, 'Cấp khoá mới');
  // The rotation's own confirm is still leaving, so the key dialog is found by its key.
  await expect(keyDialog(page)).toContainText(KEY);

  await page.keyboard.press('Escape');
  await expect(keyDialog(page)).toContainText(KEY);
  await tabUntil(page, () => document.activeElement?.id === 'key-saved');
  await page.keyboard.press('Space');
  await tabUntil(page, () => document.activeElement?.textContent?.trim() === 'Đóng');
  await page.keyboard.press('Enter');
  await expect(keyDialog(page)).toBeHidden();
  expect(await axeViolationsIn(page)).toEqual([]);
});

test('cancelling the block dialog returns focus to the Chặn button', async ({ page, api }) => {
  signInAsStaff(api, PERMISSIONS);
  api.routes['GET /judges'] = adminOk(JUDGE_FLEET);
  await page.goto('/admin/judges');
  const block = page
    .getByTestId('judge-row')
    .filter({ hasText: 'qhh-judge-02' })
    .getByRole('button', { name: 'Chặn', exact: true });
  await block.click();
  await dialogOf(page).getByRole('button', { name: 'Hủy', exact: true }).click();
  await expect(dialogOf(page)).toBeHidden();
  await expect(block).toBeFocused();
});
