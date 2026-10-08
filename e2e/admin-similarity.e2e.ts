import { expect, test } from './fixtures/api';
import { AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { adminList, adminOk, signInAsStaff } from './fixtures/admin';
import {
  similarityPair,
  similarityPairDetail,
  similarityRun,
} from '../src/test/admin-fixtures/similarity';

const PERMISSIONS = ['judge.moss_contest'];

for (const viewport of AUDIT_VIEWPORTS)
  test(`similarity runs with a summary are accessible and fit at ${viewport.name}`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    signInAsStaff(api, PERMISSIONS);
    api.routes['GET /similarity/runs'] = adminList([similarityRun()]);
    api.routes['GET /similarity/runs/run-9f02'] = adminOk(similarityRun());
    await page.goto('/admin/similarity?contest=hcmus-w41&run=run-9f02');
    await expect(page.getByRole('heading', { name: 'Kiểm tra tương đồng' })).toBeVisible();
    await expect(page.getByTestId('run-summary')).toContainText('Có nhóm bị cắt bớt.');
    expect(await axeViolationsIn(page)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });

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

for (const viewport of AUDIT_VIEWPORTS)
  test(`similar pairs list is accessible and fits at ${viewport.name}`, async ({ page, api }) => {
    await page.setViewportSize(viewport);
    signInAsStaff(api, PERMISSIONS);
    api.routes['GET /similarity/runs/run-9f02'] = adminOk(similarityRun());
    api.routes['GET /similarity/runs/run-9f02/pairs'] = adminList([similarityPair()], {
      total: 1204,
    });
    await page.goto('/admin/similarity/runs/run-9f02/pairs?minPercent=70');
    await expect(page.getByText('1.204 cặp, độ tương đồng từ 70%')).toBeVisible();
    expect(await axeViolationsIn(page)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });

for (const viewport of AUDIT_VIEWPORTS)
  test(`pair detail is accessible and fits at ${viewport.name}`, async ({ page, api }) => {
    await page.setViewportSize(viewport);
    signInAsStaff(api, PERMISSIONS);
    api.routes['GET /similarity/pairs/pair-1'] = adminOk(similarityPairDetail());
    await page.goto('/admin/similarity/pairs/pair-1');
    await expect(page.getByRole('heading', { name: 'ngocanh ↔ bao_ly' })).toBeVisible();
    expect(await axeViolationsIn(page)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
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
