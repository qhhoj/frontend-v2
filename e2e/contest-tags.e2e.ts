import { contestItem } from '../src/test/fixtures';
import { THEMES } from '../src/theme/registry';
import { CONTEST_FIXTURE_NOW, expect, list, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { adminList, adminOk, signInAsStaff } from './fixtures/admin';
import { AUDIT_VIEWPORTS, applyTheme, axeViolationsIn } from './fixtures/audit';

/** The M4A board's catalogue, one tag per colour (e2e cannot import `src/test/contest-extras-fixtures`: it uses the `@/` alias). */
const TAG_CATALOGUE = [
  ['olympic', 'Olympic'],
  ['thi-thu', 'Thi thử'],
  ['luyen-tap', 'Luyện tập'],
  ['truong', 'Trường'],
  ['quoc-gia', 'Quốc gia'],
  ['icpc', 'ICPC'],
  ['hoc-ky', 'Học kỳ'],
  ['dac-biet', 'Đặc biệt'],
].map(([slug, name], index) => ({
  slug,
  name,
  color: `tag-${index + 1}`,
  description: '',
  order: index + 1,
}));
const tagged = contestItem({ tags: ['quoc-gia', 'thi-thu', 'tin-hoc-tre-2019'] });
function withCatalogue(api: FakeApi) {
  api.routes['GET /contest-tags'] = list(TAG_CATALOGUE);
  api.routes['GET /contests'] = list([tagged]);
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(CONTEST_FIXTURE_NOW);
});

test('choosing a tag filters the list through the address and the chip shows pressed', async ({
  page,
  api,
}) => {
  withCatalogue(api);
  await page.goto('/contests');
  const row = page.getByTestId('tag-filter');
  await row.getByRole('button', { name: 'Quốc gia' }).click();
  await expect(page).toHaveURL(/\?tag=quoc-gia$/);
  await expect(row.getByRole('button', { name: 'Quốc gia' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(api.requestsTo('GET /contests').at(-1)!.url.searchParams.get('tag')).toBe('quoc-gia');
  await expect(page.locator('[data-tag-color="neutral"]').first()).toHaveText('tin-hoc-tre-2019');
});

test('an unknown tag in the address shows every contest and Bit with the notice', async ({
  page,
  api,
}) => {
  withCatalogue(api);
  await page.goto('/contests?tag=abc-xyz');
  const notice = page.getByTestId('tag-unknown');
  await expect(notice).toContainText('abc-xyz');
  await expect(notice.getByTestId('inline-bit')).toBeVisible();
});

test('a failed catalogue hides the row behind its notice and the list still loads', async ({
  page,
  api,
}) => {
  api.routes['GET /contest-tags'] = {
    status: 500,
    body: { error: { code: 'generic', message: 'x' } },
  };
  api.routes['GET /contests'] = list([tagged]);
  await page.goto('/contests');
  await expect(page.getByTestId('tag-failed')).toBeVisible();
  await expect(page.getByTestId('running-contest').first()).toBeVisible();
});

for (const viewport of AUDIT_VIEWPORTS)
  test(`the tag row is accessible in every theme and fits at ${viewport.name}`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    for (const theme of THEMES) {
      withCatalogue(api);
      await applyTheme(page, api, theme);
      await page.goto('/contests?tag=thi-thu');
      await expect(
        page.getByTestId('tag-filter').getByRole('button', { name: 'Thi thử' }),
      ).toHaveAttribute('aria-pressed', 'true');
      expect(await axeViolationsIn(page), theme.id).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  });

test('staff add a tag with a colour token and see it in the catalogue', async ({ page, api }) => {
  signInAsStaff(api, ['judge.change_contest_tag']);
  const created = { slug: 'olp', name: 'Olympic', color: 'tag-6', description: '', order: 0 };
  let catalogue: unknown[] = [];
  api.routes['GET /contest-tags'] = () => adminList(catalogue);
  api.routes['POST /contest-tags'] = () => {
    catalogue = [created];
    return adminOk(created);
  };
  await page.goto('/admin/contest-tags');
  await page.getByLabel('Mã thẻ').fill('olp');
  await page.getByLabel('Tên hiển thị').fill('Olympic');
  await page.locator('[data-color="tag-6"]').click();
  await page.getByRole('button', { name: 'Thêm thẻ', exact: true }).click();
  await expect(page.getByTestId('tag-row')).toHaveCount(1);
  await expect(page.getByRole('status').filter({ hasText: 'Đã thêm thẻ.' })).toBeVisible();
});

for (const viewport of AUDIT_VIEWPORTS)
  test(`the tag catalogue is accessible in every theme and fits at ${viewport.name}`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    for (const theme of THEMES) {
      signInAsStaff(api, ['judge.change_contest_tag']);
      api.routes['GET /contest-tags'] = adminList(TAG_CATALOGUE);
      await applyTheme(page, api, theme);
      await page.goto('/admin/contest-tags');
      await expect(page.getByTestId('tag-row')).toHaveCount(8);
      await expect(page.getByTestId('tag-editor')).toBeVisible();
      expect(await axeViolationsIn(page), theme.id).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  });
