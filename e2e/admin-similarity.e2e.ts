import { expect, test } from './fixtures/api';
import { AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { adminList, adminOk, signInAsStaff } from './fixtures/admin';
import { similarityPairDetail } from '../src/test/admin-fixtures/similarity';

const PERMISSIONS = ['judge.moss_contest'];

test('starting a run shows it queued and the list follows', async ({ page, api }) => {
  signInAsStaff(api, PERMISSIONS);
  api.routes['GET /similarity/runs'] = adminList([]);
  api.routes['POST /similarity/runs'] = { status: 202, body: { data: { runId: 'new' } } };
  await page.goto('/admin/similarity?contest=hcmus-w41');
  await page.getByRole('button', { name: 'Chạy kiểm tra tương đồng' }).click();
  await expect(page.locator('#main [role="status"]')).toContainText(
    'Lượt chạy mới đã vào hàng đợi.',
  );
  expect(api.requests.some((request) => request.key === 'POST /similarity/runs')).toBe(true);
});

test('pressing fragment #1 scrolls the right pane to its line', async ({ page, api }) => {
  signInAsStaff(api, PERMISSIONS);
  api.routes['GET /similarity/pairs/pair-1'] = adminOk(similarityPairDetail());
  await page.goto('/admin/similarity/pairs/pair-1');
  await page.getByRole('button', { name: /#1 trái 4–6/ }).click();
  await expect(page.locator('#right-line-6')).toBeInViewport();
});

for (const viewport of AUDIT_VIEWPORTS)
  test(`a long source scrolls in its own focusable region at ${viewport.name}`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    signInAsStaff(api, PERMISSIONS);
    const detail = similarityPairDetail();
    const longSource = Array.from(
      { length: 160 },
      (_unused, index) => `int value${index + 1} = ${index + 1};`,
    ).join('\n');
    api.routes['GET /similarity/pairs/pair-1'] = adminOk({
      ...detail,
      left: { ...detail.left, source: longSource },
    });
    await page.goto('/admin/similarity/pairs/pair-1');
    const region = page.getByRole('region', { name: 'Mã nguồn bên Trái' });
    await expect(region).toBeVisible();
    expect(await region.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
    expect(await axeViolationsIn(page)).toEqual([]);
  });
