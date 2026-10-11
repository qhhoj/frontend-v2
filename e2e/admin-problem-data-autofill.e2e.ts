import { expect, test } from './fixtures/api';
import { adminOk, signInAsStaff } from './fixtures/admin';
import {
  editableProblem,
  problemData,
  problemEditingMeta,
} from '../src/test/admin-fixtures/problems';

const ZIP_FILES = [
  'Test10/BAI.INP',
  'Test10/BAI.OUT',
  'Test01/BAI.INP',
  'Test01/BAI.OUT',
  'Test02/BAI.INP',
  'Test02/BAI.OUT',
  'Test03/BAI.INP',
  'checker.cpp',
];

test('fills the test list from an uploaded zip and saves it through the save bar', async ({
  page,
  api,
}) => {
  signInAsStaff(api, ['judge.edit_own_problem']);
  api.routes['GET /problems/hcmus41c'] = adminOk(editableProblem({ points: 100 }));
  api.routes['GET /problems/meta'] = adminOk(problemEditingMeta());
  api.routes['GET /problems/hcmus41c/data'] = adminOk(
    problemData({ archive: null, archiveFiles: [], cases: [], hasInit: false }),
  );
  const uploaded = problemData({ archive: 'bai.zip', archiveFiles: ZIP_FILES, cases: [] });
  api.routes['POST /problems/hcmus41c/data/archive'] = adminOk(uploaded);
  api.routes['PUT /problems/hcmus41c/data'] = ({ body }) =>
    adminOk({ ...uploaded, ...(body as object) });

  await page.goto('/admin/problems/hcmus41c/data');
  await expect(page.getByRole('button', { name: 'Tạo test từ gói zip' })).toHaveCount(0);
  await page.locator('[data-testid="upload-archive"] input').setInputFiles({
    name: 'bai.zip',
    mimeType: 'application/zip',
    buffer: Buffer.from('PK'),
  });
  await page.getByRole('button', { name: 'Tạo test từ gói zip' }).click();

  const dialog = page.getByRole('dialog', { name: 'Tạo test từ gói zip' });
  await expect(dialog.getByText('Tìm thấy 3 cặp input/output')).toBeVisible();
  await expect(dialog.getByTestId('autofill-pair')).toHaveText([
    /Test01\/BAI\.INP.*Test01\/BAI\.OUT.*33/,
    /Test02\/BAI\.INP.*Test02\/BAI\.OUT.*33/,
    /Test10\/BAI\.INP.*Test10\/BAI\.OUT.*34/,
  ]);
  await expect(dialog.getByTestId('autofill-unpaired')).toContainText('Test03/BAI.INP');
  await dialog.getByRole('button', { name: 'Thêm 3 test' }).click();
  await expect(dialog).toBeHidden();

  await expect(page.getByText('3 test', { exact: true })).toBeVisible();
  await expect(page.getByTestId('autofill-applied')).toContainText('Đã thêm 3 test');
  expect(api.requestsTo('PUT /problems/hcmus41c/data')).toHaveLength(0);
  await page.getByTestId('data-save-bar').getByRole('button', { name: 'Lưu cấu hình' }).click();
  await expect.poll(() => api.requestsTo('PUT /problems/hcmus41c/data').length).toBe(1);
  const sent = JSON.parse(String(api.requestsTo('PUT /problems/hcmus41c/data')[0].postData)) as {
    cases: { type: string; input: string; output: string; points: number }[];
  };
  expect(
    sent.cases.map(({ type, input, output, points }) => [type, input, output, points]),
  ).toEqual([
    ['C', 'Test01/BAI.INP', 'Test01/BAI.OUT', 33],
    ['C', 'Test02/BAI.INP', 'Test02/BAI.OUT', 33],
    ['C', 'Test10/BAI.INP', 'Test10/BAI.OUT', 34],
  ]);
  await expect(page.getByTestId('autofill-applied')).toHaveCount(0);
});
