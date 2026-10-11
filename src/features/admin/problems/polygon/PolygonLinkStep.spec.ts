import { describe, expect, it, vi } from 'vitest';
import { fail, mockApi, ok } from '@/test/mock-api';
import type { MockResponse } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';
import { polygonProblem } from '@/test/admin-fixtures/polygon';

const LINK = 'https://polygon.codeforces.com/p3n21nw/LamTerQH/qhh-evolution-ioi';

/** The wizard with one answer to every link check; returns the page and the API calls. */
async function pasteLink(text: string, answer: MockResponse) {
  const calls = mockApi({
    ...staffViewer(['judge.import_polygon_package', 'judge.add_problem']),
    'GET /polygon/status': ok({ connected: true, accountName: 'qhhoj' }),
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
      'Hãy cấp quyền READ cho tài khoản qhhoj trên Polygon',
    );
  });

  it('asks for a full package when the newest package is not one', async () => {
    expect(await refusalText(fail(409, 'polygon_package_not_ready'))).toContain('full package');
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
});
