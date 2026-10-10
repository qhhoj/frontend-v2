import type { Page } from '@playwright/test';
import {
  contestSettings,
  editableContest,
  participation,
} from '../src/test/admin-fixtures/contests';
import { contestDetail, contestProblem, participationSummary } from '../src/test/fixtures';
import { THEMES } from '../src/theme/registry';
import { adminList, adminOk, signInAsStaff } from './fixtures/admin';
import { CONTEST_FIXTURE_NOW, expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { AUDIT_VIEWPORTS, applyTheme, axeViolationsIn } from './fixtures/audit';
import { ok } from './fixtures/reply';

// Not imported from src/test/contest-extras-fixtures.ts: its `@/` imports do not resolve in the e2e tsconfig.
const RULES_MARKDOWN =
  '1. Trung thực\n\nTự làm bài, không trao đổi mã nguồn hay ý tưởng với người khác.';
const RULES_HTML =
  '<ol><li>Trung thực</li></ol><p>Tự làm bài, không trao đổi mã nguồn hay ý tưởng với người khác.</p>';
const ruled = contestDetail({
  rules: RULES_MARKDOWN,
  rulesHtml: RULES_HTML,
  rulesRevision: 3,
  problems: [contestProblem(0)],
});
function withRules(api: FakeApi) {
  api.signedIn = true;
  api.routes['GET /contests/r42'] = ok(ruled);
}
const fitsWidth = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(CONTEST_FIXTURE_NOW);
});

test('joining asks for the rules, the button waits for the tick, and the acceptance is sent', async ({
  page,
  api,
}) => {
  withRules(api);
  api.routes['POST /contests/:key/join'] = ok(participationSummary());
  await page.goto('/contests/r42');
  await page.getByRole('button', { name: 'Vào thi' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('phiên bản quy định 3');
  await expect(dialog.getByTestId('inline-bit').first()).toBeVisible();
  const confirm = dialog.getByRole('button', { name: 'Vào thi', exact: true });
  await expect(confirm).toHaveAttribute('aria-disabled', 'true');
  await dialog.getByLabel('Tôi đã đọc và đồng ý').check();
  await expect(confirm).not.toHaveAttribute('aria-disabled', 'true');
  await confirm.click();
  await expect(dialog).toBeHidden();
  const sent = api.requestsTo('POST /contests/r42/join');
  expect(sent).toHaveLength(1);
  expect(sent[0].postData?.toString()).toContain('"acceptRules":true');
});

test('a refusal keeps the tick and shows sweating Bit inside the dialog', async ({ page, api }) => {
  withRules(api);
  api.routes['POST /contests/:key/join'] = {
    status: 400,
    body: { error: { code: 'rules_not_accepted', message: 'x', issues: [] } },
  };
  await page.goto('/contests/r42');
  await page.getByRole('button', { name: 'Vào thi' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Tôi đã đọc và đồng ý').check();
  await dialog.getByRole('button', { name: 'Vào thi', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('Hãy chọn ô đồng ý');
  await expect(dialog.getByRole('alert').getByTestId('inline-bit')).toBeVisible();
  await expect(dialog.getByLabel('Tôi đã đọc và đồng ý')).toBeChecked();
});

for (const viewport of AUDIT_VIEWPORTS)
  test(`the rules dialog is accessible in every theme and fits at ${viewport.name}`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    for (const theme of THEMES) {
      withRules(api);
      await applyTheme(page, api, theme);
      await page.goto('/contests/r42');
      await page.getByRole('button', { name: 'Vào thi' }).click();
      await expect(page.getByRole('dialog')).toContainText('Trung thực');
      expect(await axeViolationsIn(page), theme.id).toEqual([]);
      expect(await fitsWidth(page)).toBe(true);
      await page.keyboard.press('Escape');
    }
  });

test('the rules card opens the full rules in place', async ({ page, api }) => {
  withRules(api);
  await page.goto('/contests/r42');
  const card = page.getByTestId('join-rules-card');
  await expect(card).toContainText('bản 3');
  await expect(card.getByTestId('inline-bit')).toBeVisible();
  await card.getByRole('button', { name: 'Đọc quy định' }).click();
  await expect(card.getByRole('button', { name: 'Thu gọn' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await expect(card).toContainText('Tự làm bài, không trao đổi mã nguồn');
});

for (const viewport of AUDIT_VIEWPORTS)
  test(`the contest page with its rules card is accessible in every theme at ${viewport.name}`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    for (const theme of THEMES) {
      withRules(api);
      await applyTheme(page, api, theme);
      await page.goto('/contests/r42');
      await page
        .getByTestId('join-rules-card')
        .getByRole('button', { name: 'Đọc quy định' })
        .click();
      expect(await axeViolationsIn(page), theme.id).toEqual([]);
      expect(await fitsWidth(page)).toBe(true);
    }
  });

test('an editor writes the rules and sees accepted revisions in the participations list', async ({
  page,
  api,
}) => {
  signInAsStaff(api, ['judge.edit_own_contest']);
  api.routes['GET /contests/hcmus-w41'] = adminOk(editableContest({ settings: contestSettings() }));
  api.routes['PATCH /contests/hcmus-w41'] = adminOk(editableContest({ rules: 'Tự làm bài.' }));
  api.routes['GET /contests/hcmus-w41/participations'] = adminList([
    participation({ rulesAcceptedAt: '2026-10-08T05:58:00.000Z', rulesAcceptedRevision: 3 }),
  ]);
  await page.goto('/admin/contests/hcmus-w41/general');
  await page.getByLabel('Quy định kỳ thi').fill('Tự làm bài.');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect.poll(() => api.requestsTo('PATCH /contests/hcmus-w41').length).toBe(1);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/admin/contests/hcmus-w41/participants');
  await expect(page.getByRole('cell', { name: /bản 3/ })).toBeVisible();
});

for (const viewport of AUDIT_VIEWPORTS)
  test(`the operations section is accessible in every theme at ${viewport.name}`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    for (const theme of THEMES) {
      signInAsStaff(api, ['judge.edit_own_contest']);
      api.routes['GET /contests/hcmus-w41'] = adminOk(editableContest());
      await applyTheme(page, api, theme);
      await page.goto('/admin/contests/hcmus-w41/general');
      await expect(page.getByLabel('Quy định kỳ thi')).toBeVisible();
      expect(await axeViolationsIn(page), theme.id).toEqual([]);
      expect(await fitsWidth(page)).toBe(true);
    }
  });
