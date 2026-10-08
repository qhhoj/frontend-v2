import { beforeAll, describe, expect, it } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import type { mountApp } from '@/test/mount';
import { fail, mockApi, ok } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { confirmDialog, staffViewer } from '@/test/admin-routes';
import { contestEditorRoutes, officialRanking, rankingLink } from '@/test/admin-fixtures/contests';
import { mountAndWaitFor } from '../contest-spec-helpers';

/** Some jsdom versions have no `Blob.text()`; the component uses the real API, so the spec supplies the FileReader route. */
function readBlobAsText(this: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsText(this);
  });
}

beforeAll(() => {
  if (!('text' in File.prototype)) {
    Object.defineProperty(File.prototype, 'text', {
      value: readBlobAsText,
      configurable: true,
      writable: true,
    });
  }
});

const EDIT = ['judge.edit_own_contest'];
const base = (official: MockHandler, link: MockHandler) => ({
  ...staffViewer(EDIT),
  ...contestEditorRoutes(),
  'GET /contests/hcmus-w41/official-ranking': official,
  'GET /contests/hcmus-w41/ranking-link': link,
});
const click = async (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper'], text: string) => {
  await wrapper
    .findAll('button')
    .find((button) => button.text() === text)!
    .trigger('click');
  await flushPromises();
};
const RANKING_TEXT = 'Bảng xếp hạng chính thức';

describe('ContestRankingTab', () => {
  it('uploads a CSV as text, and shows the backend reason when it is refused', async () => {
    const calls = mockApi({
      ...base(fail(404, 'not_found'), fail(404, 'not_found')),
      'PUT /contests/hcmus-w41/official-ranking': fail(400, 'validation_failed', {
        csv: ['Line 14 has 9 columns; the header has 10.'],
      }),
    });
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/ranking', RANKING_TEXT);
    const input = wrapper.get('[data-testid="official-csv"] input');
    Object.defineProperty(input.element, 'files', {
      value: [new File(['rank,username\n1,a\n'], 'w41.csv', { type: 'text/csv' })],
    });
    await input.trigger('change');
    await click(wrapper, 'Tải lên');
    expect(calls.find((call) => call.method === 'PUT')?.body).toEqual({
      csv: 'rank,username\n1,a\n',
    });
    expect(wrapper.text()).toContain('Line 14 has 9 columns; the header has 10.');
  });

  it('shows the first rows of the stored table and deletes it after confirming', async () => {
    const calls = mockApi({
      ...base(ok(officialRanking()), fail(404, 'not_found')),
      'DELETE /contests/hcmus-w41/official-ranking': { status: 204 },
    });
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/ranking', 'ngocanh');
    expect(wrapper.get('[data-testid="official-table"]').text()).toContain('ngocanh');
    await click(wrapper, 'Xóa bảng chính thức');
    expect(calls.some((call) => call.method === 'DELETE')).toBe(false);
    await confirmDialog('Xóa');
    expect(calls.some((call) => call.method === 'DELETE')).toBe(true);
  });

  it('offers to create a link when there is none, then shows it with a copy button', async () => {
    mockApi({
      ...base(fail(404, 'not_found'), fail(404, 'not_found')),
      'POST /contests/hcmus-w41/ranking-link': ok(rankingLink()),
    });
    const { wrapper } = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/ranking',
      'Chưa có liên kết?',
    );
    expect(wrapper.text()).toContain('Chưa có liên kết?');
    await click(wrapper, 'Tạo liên kết');
    expect(wrapper.text()).toContain('/public-rankings/q7Hk2xVn9aTzP4mR');
  });

  it('regenerates only after confirming that the old URL stops working', async () => {
    const calls = mockApi({
      ...base(fail(404, 'not_found'), ok(rankingLink())),
      'POST /contests/hcmus-w41/ranking-link/regenerate': ok(rankingLink({ token: 'newToken' })),
    });
    const { wrapper } = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/ranking',
      'q7Hk2xVn9aTzP4mR',
    );
    await click(wrapper, 'Tạo lại đường dẫn');
    expect(document.body.querySelector('[role="dialog"]')?.textContent).toContain(
      'Đường dẫn cũ sẽ ngừng hoạt động',
    );
    expect(calls.some((call) => call.path.endsWith('/regenerate'))).toBe(false);
    await confirmDialog('Tạo lại');
    expect(calls.some((call) => call.path.endsWith('/regenerate'))).toBe(true);
    expect(wrapper.text()).toContain('newToken');
  });
});
