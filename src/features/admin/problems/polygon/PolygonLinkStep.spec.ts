import { describe, expect, it, vi } from 'vitest';
import { fail, mockApi, ok } from '@/test/mock-api';
import type { MockResponse } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';
import { importJob, polygonPackage, polygonProblem } from '@/test/admin-fixtures/polygon';

const LINK = 'https://polygon.codeforces.com/p3n21nw/LamTerQH/qhh-evolution-ioi';

/** The wizard with one answer to every link check; returns the page and the API calls. */
async function pasteLink(text: string, answer: MockResponse, myImports: unknown[] = []) {
  const calls = mockApi({
    ...staffViewer(['judge.add_problem', 'judge.delete_problem']),
    'GET /polygon/status': ok({ connected: true, accountName: 'qhhoj' }),
    'GET /problems/imports': ok(myImports),
    'POST /polygon/resolve': answer,
  });
  const { wrapper } = await mountApp('/admin/problems/polygon');
  await vi.waitFor(() => expect(wrapper.find('#polygon-link').exists()).toBe(true), {
    timeout: 5000,
  });
  await wrapper.get('#polygon-link').setValue(text);
  return { wrapper, calls };
}
const refusalText = async (answer: MockResponse) => {
  const { wrapper } = await pasteLink(LINK, answer);
  await vi.waitFor(
    () => expect(wrapper.find('[data-testid="polygon-link-refusal"]').exists()).toBe(true),
    { timeout: 5000 },
  );
  return wrapper.get('[data-testid="polygon-link-refusal"]').text();
};

describe('Polygon link step', () => {
  it('checks a pasted link once and shows the verified preview', async () => {
    const { wrapper, calls } = await pasteLink(` ${LINK} `, ok(polygonProblem({ id: 595944 })));
    await vi.waitFor(
      () => expect(wrapper.find('[data-testid="polygon-link-preview"]').exists()).toBe(true),
      { timeout: 5000 },
    );
    expect(wrapper.get('[data-testid="polygon-link-verified"]').text()).toBe(
      'Đã xác minh liên kết',
    );
    expect(wrapper.text()).toContain('p3n21nw');
    const checks = calls.filter((call) => call.path === '/polygon/resolve');
    expect(checks.map((call) => call.body)).toEqual([{ link: LINK }]);
  });

  it('says a malformed link is not a Polygon link without asking the server', async () => {
    const { wrapper, calls } = await pasteLink(
      'https://polygon.codeforces.com.evil.io/p3n21nw/a/b',
      ok(polygonProblem()),
    );
    expect(wrapper.get('[data-testid="polygon-link-refusal"]').text()).toContain(
      'Đây không phải liên kết bài trên Polygon',
    );
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(calls.some((call) => call.path === '/polygon/resolve')).toBe(false);
  });

  it('asks for READ access when qhhoj cannot open the link', async () => {
    expect(await refusalText(fail(404, 'polygon_link_refused'))).toContain(
      'Hãy cấp quyền READ cho qhhoj trên Polygon',
    );
  });

  it('asks for a READY package when the newest package is not READY', async () => {
    expect(await refusalText(fail(409, 'polygon_package_not_ready'))).toContain(
      'Chưa có gói sẵn sàng để nhập',
    );
  });

  it('links the already linked problem only when the server names it', async () => {
    expect(
      await refusalText(
        fail(409, 'polygon_already_linked', undefined, undefined, {
          linkedProblemCode: 'qhhdisc',
        }),
      ),
    ).toContain('Mở qhhdisc');
    expect(await refusalText(fail(409, 'polygon_already_linked'))).toContain(
      'đã liên kết với một bài trên QHHOJ',
    );
  });

  it('names an editing-session address and what to paste instead, without asking the server', async () => {
    const { wrapper, calls } = await pasteLink(
      'https://polygon.codeforces.com/generalInfo?ccid=a1b2c3&session=d4e5f6',
      ok(polygonProblem()),
    );
    const refusal = wrapper.get('[data-testid="polygon-link-refusal"]');
    expect(refusal.attributes('data-refusal')).toBe('editing');
    expect(refusal.text()).toContain('Đây là địa chỉ trang soạn bài');
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(calls.some((call) => call.path === '/polygon/resolve')).toBe(false);
  });

  it("shows a failed package's revision and Polygon's comment", async () => {
    const newestPackage = { id: 9, revision: 11, state: 'FAILED', comment: 'wa.cpp passed' };
    const text = await refusalText(
      fail(409, 'polygon_package_not_ready', undefined, undefined, { newestPackage }),
    );
    expect(text).toContain('Gói mới nhất (r11) bị lỗi trên Polygon');
    expect(text).toContain('wa.cpp passed');
  });

  it('gives restore guidance for a link held by a deleted problem, without opening it', async () => {
    const { wrapper } = await pasteLink(
      LINK,
      fail(409, 'polygon_linked_deleted', undefined, undefined, { linkedProblemCode: 'abc' }),
    );
    await vi.waitFor(
      () => expect(wrapper.find('[data-refusal="linkedDeleted"]').exists()).toBe(true),
      { timeout: 5000 },
    );
    const refusal = wrapper.get('[data-refusal="linkedDeleted"]');
    expect(refusal.text()).toContain('Khôi phục abc');
    expect(refusal.text()).not.toContain('Mở abc');
    expect(refusal.get('a').attributes('href')).toBe('/admin/problems/deleted');
  });

  it('warns that the newest package is older than the committed revision', async () => {
    const stale = polygonProblem({ revision: 10, latestPackage: polygonPackage({ revision: 9 }) });
    const { wrapper } = await pasteLink(LINK, ok(stale));
    await vi.waitFor(() => expect(wrapper.find('[data-caution="stale"]').exists()).toBe(true), {
      timeout: 5000,
    });
    expect(wrapper.get('[data-caution="stale"]').text()).toContain(
      'Gói mới nhất là r9, Polygon đã có r10',
    );
  });

  it("lists the viewer's recent imports, each reopening its progress", async () => {
    const { wrapper } = await pasteLink('', ok(polygonProblem()), [
      importJob({ id: 'job-7', code: 'kminmax', state: 'active' }),
    ]);
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="polygon-my-imports"]').exists()).toBe(true),
    );
    const row = wrapper.get('[data-testid="polygon-my-imports"] li');
    expect(row.text()).toContain('kminmax');
    expect(row.text()).toContain('Đang chạy');
    expect(row.get('a').attributes('href')).toBe('/admin/problems/polygon?job=job-7');
  });
});
