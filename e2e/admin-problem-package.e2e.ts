import { expect, test } from './fixtures/api';
import { adminOk, signInAsStaff } from './fixtures/admin';
import type { FakeApi } from './fixtures/api';
import {
  editableProblem,
  problemData,
  problemEditingMeta,
} from '../src/test/admin-fixtures/problems';
import { packageStatus } from '../src/test/f4-fixtures';

function editorRoutes(api: FakeApi) {
  signInAsStaff(api, ['judge.edit_own_problem']);
  api.routes['GET /problems/hcmus41c'] = adminOk(editableProblem());
  api.routes['GET /problems/meta'] = adminOk(problemEditingMeta());
  api.routes['GET /problems/hcmus41c/data'] = adminOk(problemData());
  api.routes['GET /problems/hcmus41c/polygon'] = {
    status: 404,
    body: { error: { code: 'polygon_not_linked', message: 'not linked' } },
  };
}

test('builds the package, polls, and offers the zip link', async ({ page, api }) => {
  editorRoutes(api);
  let probes = 0;
  api.routes['POST /problems/hcmus41c/package'] = {
    status: 202,
    body: { data: packageStatus('building') },
  };
  api.routes['GET /problems/hcmus41c/package'] = () => {
    probes += 1;
    return probes === 1
      ? { status: 202, headers: { 'Retry-After': '3' }, body: { data: { status: 'building' } } }
      : { status: 200, contentType: 'application/zip', raw: Buffer.from('PK') };
  };
  await page.goto('/admin/problems/hcmus41c/data?view=advanced');
  await page.getByRole('button', { name: 'Tải gói đề' }).click();
  await expect(page.getByText('Đang đóng gói', { exact: false })).toBeVisible();
  await expect(page.getByTestId('problem-package').getByRole('status')).toBeVisible();
  const link = page.getByRole('link', { name: 'Tải hcmus41c.zip' });
  await expect(link).toBeVisible({ timeout: 15_000 });
  await expect(link).toHaveAttribute('href', '/api/internal/problems/hcmus41c/package');
  expect(
    api.requests.filter((request) => request.key === 'POST /problems/hcmus41c/package'),
  ).toHaveLength(1);
});

test('a package over the cap says so', async ({ page, api }) => {
  editorRoutes(api);
  api.routes['POST /problems/hcmus41c/package'] = {
    status: 202,
    body: { data: packageStatus('building') },
  };
  api.routes['GET /problems/hcmus41c/package'] = {
    status: 409,
    body: { error: { code: 'package_too_large', message: 'too large' } },
  };
  await page.goto('/admin/problems/hcmus41c/data?view=advanced');
  await page.getByRole('button', { name: 'Tải gói đề' }).click();
  await expect(page.getByRole('alert').filter({ hasText: '512 MiB' })).toBeVisible({
    timeout: 10_000,
  });
});
