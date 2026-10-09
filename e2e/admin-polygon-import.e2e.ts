import { expect, test } from './fixtures/api';
import { AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { adminOk, signInAsStaff } from './fixtures/admin';

const PERMISSION = 'judge.import_polygon_package';
/** The Task 4 meta shape, inline: the e2e project has no `@` alias to import the unit fixture through. */
const META = {
  types: [
    {
      id: '0192a000-0000-7000-8000-0000000000aa',
      name: 'shortest',
      fullName: 'Đường đi ngắn nhất',
    },
  ],
  groups: [{ id: '0192a000-0000-7000-8000-0000000000bb', name: 'graph', fullName: 'Đồ thị' }],
  licenses: [],
  languages: [],
};
const job = (state: string, result: unknown = null) => ({
  id: 'job-1',
  state,
  result,
  error: null,
});

for (const viewport of AUDIT_VIEWPORTS)
  test(`Polygon import at ${viewport.name}: start, follow the job to done, and open the problem`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    signInAsStaff(api, [PERMISSION, 'judge.add_problem']);
    api.routes['GET /problems/meta'] = adminOk(META);
    api.routes['POST /problems/imports'] = { status: 202, body: { data: { jobId: 'job-1' } } };
    let polls = 0;
    api.routes['GET /problems/imports/job-1'] = () => {
      polls += 1;
      return adminOk(
        polls < 2 ? job('active') : job('completed', { problemId: 'p-1', code: 'hcmus41c' }),
      );
    };

    await page.goto('/admin/problems/import');
    await page.locator('[data-testid="polygon-file"] input').setInputFiles({
      name: 'hcmus41c.zip',
      mimeType: 'application/zip',
      buffer: Buffer.from('zip'),
    });
    await page.getByLabel('Mã bài').fill('hcmus41c');
    await page.getByRole('button', { name: 'Bắt đầu nhập' }).click();

    const openLink = page.getByRole('link', { name: 'Mở hcmus41c' });
    await expect(openLink).toBeVisible({ timeout: 10_000 });
    expect(api.requestsTo('POST /problems/imports')).toHaveLength(1);
    expect(await axeViolationsIn(page)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
