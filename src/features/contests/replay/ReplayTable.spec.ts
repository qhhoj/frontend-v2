import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import type { RankingContext } from '@/lib/ranking-cells';
import { rankingRow, sessionUser } from '@/test/fixtures';
import { stubMatchMedia } from '@/test/match-media';
import { mountComponent } from '@/test/mount';
import { loadedReplay } from '@/test/replay-fixtures';
import ReplayTable from './ReplayTable.vue';
import { boardAt, indexReplay, virtualRowOf } from './replay-board';

const ICPC: RankingContext = {
  formatName: 'icpc',
  pointsPrecision: 0,
  locale: 'vi',
  showsTime: true,
};
const REPLAY_END = 10_800;
const index = indexReplay(loadedReplay());
const table = (seconds: number, extra = [] as ReturnType<typeof virtualRowOf>[]) =>
  mountComponent(ReplayTable, {
    props: {
      board: boardAt(index, seconds, ICPC, extra),
      context: ICPC,
      viewerId: sessionUser().id,
      label: 'Bảng xếp hạng phát lại',
    },
  });
const rowTexts = (wrapper: ReturnType<typeof table>) =>
  wrapper.findAll('tbody tr').map((row) =>
    row
      .findAll('td, th')
      .slice(0, 3)
      .map((cell) => cell.text().replace(/\s+/g, ' ')),
  );

describe('ReplayTable', () => {
  afterEach(() => document.documentElement.removeAttribute('data-low-power'));

  it('draws the board in rank order, ghosts muted with an icon and a chip, unranked last with no score', () => {
    stubMatchMedia();
    const wrapper = table(600);
    expect(rowTexts(wrapper)).toEqual([
      ['1', 'Ghost · HSG 2024 #1THPT chuyên AGhost', '1'],
      ['2', 'user_07', '1'],
      ['3', 'user_12', '0'],
      ['3', 'user_01Bạn', '0'],
      ['3', 'user_03', '0'],
      ['—', 'Ghost · HSG 2024 #9Không đủ dữ liệu', '—'],
    ]);
    const ghost = wrapper.get('tr[data-kind="ghost"] th > span');
    expect(ghost.classes()).toContain('text-muted');
    expect(ghost.find('svg[aria-hidden="true"]').exists()).toBe(true);
    expect(wrapper.get('caption').text()).toBe('Bảng xếp hạng phát lại');
  });

  it("prints cells with the ranking's own rules, first solve and penalty included", () => {
    stubMatchMedia();
    const leader = table(REPLAY_END)
      .findAll('tbody tr')
      .find((row) => row.text().includes('user_07'))!;
    expect(leader.findAll('td span[aria-hidden="true"]').map((cell) => cell.text())).toEqual([
      '+ 0:09',
      '+ 0:31',
    ]);
    expect(leader.findAll('td').at(2)!.text()).toBe('40');
  });

  it('redraws a row when the clock brings it new cells or the first-solve star, and keeps the others right', async () => {
    stubMatchMedia().setReducedMotion(true);
    const wrapper = table(600);
    const rowOf = (username: string) =>
      wrapper.findAll('tbody tr').find((row) => row.text().includes(username))!;
    const cellsOf = (username: string) =>
      rowOf(username)
        .findAll('td span[aria-hidden="true"]')
        .map((cell) => cell.text());
    const starsOf = (username: string) => rowOf(username).findAll('td svg').length;
    const rankOf = (username: string) => rowOf(username).get('td').text();
    expect([cellsOf('user_07'), starsOf('user_07')]).toEqual([['+ 0:09'], 1]);
    expect(rankOf('user_03')).toBe('3');
    await wrapper.setProps({ board: boardAt(index, REPLAY_END, ICPC) } as never);
    expect([cellsOf('user_07'), starsOf('user_07')]).toEqual([['+ 0:09', '+ 0:31'], 2]);
    expect(cellsOf('user_12')).toEqual(['+1 0:12']);
    expect(rankOf('user_03')).toBe('5');
    await wrapper.setProps({ board: boardAt(index, 600, ICPC) } as never);
    expect([cellsOf('user_07'), starsOf('user_07')]).toEqual([['+ 0:09'], 1]);
    expect(cellsOf('user_12')).toEqual(['−1']);
  });

  it('moves the viewer highlight when the viewer changes on the same board, rows still or sliding', async () => {
    const media = stubMatchMedia();
    media.setReducedMotion(true);
    const wrapper = table(600);
    const highlighted = () =>
      wrapper.findAll('tbody tr.bg-surface-hover').map((row) => row.attributes('data-row-id'));
    expect(highlighted()).toEqual(['part-01']);
    await wrapper.setProps({ viewerId: null } as never);
    expect(highlighted()).toEqual([]);
    media.setReducedMotion(false);
    await wrapper.setProps({ viewerId: sessionUser().id } as never);
    expect(highlighted()).toEqual(['part-01']);
  });

  it("marks the viewer's live virtual row and highlights it", () => {
    stubMatchMedia();
    const virtual = virtualRowOf({
      ...rankingRow(1, 'part-01v', 'user_01', 1, 20, {}),
      virtual: 1,
    });
    const row = table(1500, [virtual]).get('tr[data-kind="virtual"]');
    expect(row.text()).toContain('(ảo)');
    expect(row.classes()).toContain('bg-surface-hover');
  });

  it('animates rows only while motion is allowed, and stops at once under reduced motion or low-power', async () => {
    const media = stubMatchMedia();
    const wrapper = table(600);
    const motion = () => wrapper.get('tbody').attributes('data-motion');
    expect(motion()).toBe('on');
    media.setReducedMotion(true);
    await nextTick();
    expect(motion()).toBe('off');
    media.setReducedMotion(false);
    await nextTick();
    expect(motion()).toBe('on');
    document.documentElement.setAttribute('data-low-power', '');
    await vi.waitFor(() => expect(motion()).toBe('off'));
  });

  it('moves focus to a row on request and reports a missing one', () => {
    stubMatchMedia();
    const wrapper = table(600);
    const exposed = wrapper.vm as unknown as { focusRow(rowId: string): boolean };
    expect(exposed.focusRow('part-01')).toBe(true);
    expect(document.activeElement?.textContent).toContain('user_01');
    expect(exposed.focusRow('nobody')).toBe(false);
  });
});
