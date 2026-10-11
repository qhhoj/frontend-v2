import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, mockApi, ok, sequence } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { cancelDialog, confirmDialog, staffViewer } from '@/test/admin-routes';
import { EMPTY_JUDGE_QUEUE, JUDGE_FLEET } from '@/test/admin-fixtures/judges';

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
  'GET /judges/queue': ok(EMPTY_JUDGE_QUEUE),
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
    expect(document.body.textContent).toContain('rotated-key-value');
  });

  it('returns focus to the Chặn button when its dialog is cancelled', async () => {
    mockApi(routes());
    const { wrapper } = await mountJudges();
    const block = rowOf(wrapper, 'qhh-judge-02')
      .findAll('button')
      .find((button) => button.text() === 'Chặn')!;
    (block.element as HTMLButtonElement).focus();
    await block.trigger('click');
    await flushPromises();
    // Focus moves into the dialog, as it does on open in a browser (jsdom never runs the enter hook that does it).
    (document.body.querySelector('[role="dialog"] button') as HTMLButtonElement).focus();
    await cancelDialog('Hủy');
    expect(document.activeElement).toBe(block.element);
  });

  it('keeps the rotated key on screen when a refetch fails', async () => {
    mockApi(
      routes({
        'GET /judges': sequence(ok(JUDGE_FLEET), fail(500, 'generic')),
        'POST /judges/qhh-judge-02/key': ok({ authKey: 'rotated-key-value' }),
      }),
    );
    const { wrapper, queryClient } = await mountJudges();
    await rowOf(wrapper, 'qhh-judge-02')
      .findAll('button')
      .find((button) => button.text() === 'Khoá')!
      .trigger('click');
    await flushPromises();
    await confirmDialog('Cấp khoá mới');
    await queryClient.invalidateQueries({ queryKey: ['admin', 'judges'] });
    await flushPromises();
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    expect(document.body.textContent).toContain('rotated-key-value');
  });
});
