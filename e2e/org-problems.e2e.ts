import { expect, test } from './fixtures/api';
import { f4Id, orgProblem, ORG_PROBLEMS, problemTag } from '../src/test/f4-fixtures';
import { AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { installOrgProblems } from './fixtures/f4-api';

const TAB = '/organizations/lhp/problems';

test('bulk archive reports a partial result with the sweating Bit', async ({ page, api }) => {
  installOrgProblems(api, { canAdminister: true });
  api.routes['POST /organizations/lhp/problems/bulk'] = {
    body: {
      data: {
        results: [
          { code: 'lhp_tree', outcome: 'done' },
          { code: 'lhp_sp', outcome: 'skipped', reason: 'not_found' },
        ],
        done: 1,
        skipped: 1,
      },
    },
  };
  await page.goto(TAB);
  await page.getByRole('checkbox', { name: 'Chọn lhp_tree' }).check();
  await page.getByRole('checkbox', { name: 'Chọn lhp_sp' }).check();
  const bar = page.getByTestId('org-bulk-bar');
  await expect(bar.getByText('Đã chọn 2 bài')).toBeVisible();
  expect(await axeViolationsIn(page)).toEqual([]);
  await bar.getByRole('button', { name: 'Lưu trữ', exact: true }).click();
  const result = page.getByTestId('org-bulk-result');
  await expect(result.getByText('1/2 thành công', { exact: false })).toBeVisible();
  await expect(result.getByText('lhp_sp không còn thuộc tổ chức này')).toBeVisible();
  await expect(result.getByTestId('inline-bit')).toBeVisible();
  await expect(bar.getByText('Đã chọn 1 bài')).toBeVisible();
});

const ROW_ACTION_HEIGHT = 44;
/** The longest tag name the dialog accepts is 40 characters, and it can be one word: the chip must wrap inside it. */
const LONG_TAG = problemTag({ id: f4Id(790), slug: 'long', name: 'a'.repeat(38), color: 'tag-4' });
const WIDE_ROWS = [
  ...ORG_PROBLEMS,
  orgProblem({ code: 'lhp_long', tags: [LONG_TAG] }),
  orgProblem({ code: 'lhp_old', name: 'Đường đi ngắn nhất qua các thành phố', isArchived: true }),
];

for (const viewport of AUDIT_VIEWPORTS)
  for (const canAdminister of [true, false])
    test(`org problems at ${viewport.name} as ${canAdminister ? 'admin' : 'member'}: chips and actions stay whole, nothing scrolls sideways`, async ({
      page,
      api,
    }) => {
      await page.setViewportSize(viewport);
      installOrgProblems(api, { canAdminister, rows: WIDE_ROWS });
      await page.goto(TAB);
      const archivedChip = page
        .locator('tr, li')
        .filter({ hasText: 'lhp_old' })
        .getByText('Đã lưu trữ', { exact: true });
      await expect(archivedChip).toBeVisible();
      expect(await archivedChip.evaluate((chip) => chip.getClientRects().length)).toBe(1);
      if (canAdminister) {
        const archive = page.getByRole('button', { name: 'Lưu trữ lhp_tree' });
        expect((await archive.boundingBox())!.height).toBeLessThanOrEqual(ROW_ACTION_HEIGHT);
      }
      const [scrollWidth, clientWidth] = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        document.documentElement.clientWidth,
      ]);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
      expect(await axeViolationsIn(page)).toEqual([]);
    });
