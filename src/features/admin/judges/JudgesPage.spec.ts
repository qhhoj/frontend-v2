import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { confirmDialog, staffViewer } from '@/test/admin-routes';
import { JUDGE_FLEET, judge } from '@/test/admin-fixtures/judges';

/** The screen is a lazy route: the board is there once its chunk and its list have loaded. */
const mountJudges = async () => {
  const mounted = await mountApp('/admin/judges');
  await vi.waitFor(() =>
    expect(mounted.wrapper.find('[data-testid="judge-stats"]').exists()).toBe(true),
  );
  return mounted;
};

const PERMS = ['judge.change_judge'];
const routes = (extra = {}) => ({
  ...staffViewer(PERMS),
  'GET /judges': ok(JUDGE_FLEET),
  ...extra,
});
const rowOf = (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper'], name: string) =>
  wrapper.findAll('[data-testid="judge-row"]').find((row) => row.text().includes(name))!;

describe('JudgesPage', () => {
  it('summarises the fleet and shows ping in ms with a status word for each judge', async () => {
    mockApi(routes());
    const { wrapper } = await mountJudges();
    expect(wrapper.get('[data-testid="judge-stats"]').text()).toContain('3 / 5');
    // formatNumber(meanLoad, locale, 2): the default rounds to whole numbers and would print 0.
    expect(wrapper.get('[data-testid="judge-stats"]').text()).toContain('0,28');
    expect(rowOf(wrapper, 'qhh-judge-01').text()).toContain('11 ms');
    expect(rowOf(wrapper, 'thu-nghiem').text()).toContain('Bị chặn');
    expect(rowOf(wrapper, 'qhh-judge-04').text()).toContain('Đã tắt');
  });

  it('blocks a judge with PATCH and shows the answer', async () => {
    const calls = mockApi(
      routes({
        'PATCH /judges/qhh-judge-02': ok(
          judge({
            id: '0192a000-0000-7000-8000-00000000a102',
            name: 'qhh-judge-02',
            isBlocked: true,
          }),
        ),
      }),
    );
    const { wrapper } = await mountJudges();
    await rowOf(wrapper, 'qhh-judge-02')
      .findAll('button')
      .find((button) => button.text() === 'Chặn')!
      .trigger('click');
    await flushPromises();
    expect(calls.some((call) => call.method === 'PATCH')).toBe(false);
    await confirmDialog('Chặn');
    expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({ isBlocked: true });
    expect(rowOf(wrapper, 'qhh-judge-02').text()).toContain('Bỏ chặn');
  });

  it('disconnects with the force flag the dialog sets', async () => {
    const calls = mockApi(routes({ 'POST /judges/qhh-judge-02/disconnect': { status: 204 } }));
    const { wrapper } = await mountJudges();
    await rowOf(wrapper, 'qhh-judge-02')
      .findAll('button')
      .find((button) => button.text() === 'Ngắt')!
      .trigger('click');
    await flushPromises();
    (document.body.querySelector('#disconnect-force') as HTMLInputElement).click();
    await confirmDialog('Ngắt kết nối');
    expect(calls.find((call) => call.path.endsWith('/disconnect'))?.body).toEqual({ force: true });
  });

  it('rotates a key only after confirming that the judge disconnects, then reveals the new key', async () => {
    const calls = mockApi(
      routes({ 'POST /judges/qhh-judge-02/key': ok({ authKey: 'rotated-key-value' }) }),
    );
    const { wrapper } = await mountJudges();
    await rowOf(wrapper, 'qhh-judge-02')
      .findAll('button')
      .find((button) => button.text() === 'Khoá')!
      .trigger('click');
    await flushPromises();
    expect(document.body.querySelector('[role="dialog"]')?.textContent).toContain(
      'Máy chấm bị ngắt ngay',
    );
    expect(calls.some((call) => call.path.endsWith('/key'))).toBe(false);
    await confirmDialog('Cấp khoá mới');
    expect(document.body.querySelector('[role="dialog"]')?.textContent).toContain(
      'rotated-key-value',
    );
  });

  it('saves a description from the expanded row', async () => {
    const calls = mockApi(
      routes({ 'PATCH /judges/qhh-judge-01': ok(judge({ description: 'Mới' })) }),
    );
    const { wrapper } = await mountJudges();
    await rowOf(wrapper, 'qhh-judge-01').get('button[aria-expanded]').trigger('click');
    await wrapper.get('#judge-description-qhh-judge-01').setValue('Mới');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Lưu mô tả')!
      .trigger('click');
    await flushPromises();
    expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({ description: 'Mới' });
  });
});
