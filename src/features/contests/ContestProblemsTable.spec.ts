import { describe, expect, it } from 'vitest';
import { contestDetail, contestProblem, contestViewer } from '@/test/fixtures';
import { mountComponent } from '@/test/mount';
import ContestProblemsTable from './ContestProblemsTable.vue';

describe('contest problems table limits', () => {
  it('shows one limits column, with a dash for a problem the viewer may not see', () => {
    const contest = contestDetail({
      problems: [
        contestProblem(0, { timeLimit: 1, memoryLimit: 262_144 }),
        contestProblem(1, { timeLimit: null, memoryLimit: null }),
      ],
    });
    const wrapper = mountComponent(ContestProblemsTable, { props: { contest } });
    const headers = wrapper.findAll('thead th').map((cell) => cell.text());
    expect(headers.filter((text) => text === 'Giới hạn')).toHaveLength(1);
    const rows = wrapper.findAll('tbody tr').map((row) => row.findAll('td')[1]!.text());
    expect(rows).toEqual(['1 s · 256 MB', '—']);
    expect(wrapper.get('ul li').text()).toContain('1 s · 256 MB');
  });
});

describe('contest problems table best-submissions column', () => {
  const mountWith = (canSeeFullScoreboard: boolean) =>
    mountComponent(ContestProblemsTable, {
      props: {
        contest: contestDetail({
          problems: [contestProblem(0)],
          viewer: contestViewer({ canSeeFullScoreboard }),
        }),
      },
    });

  it('links each problem to its best submissions when the ranking is open to the viewer', () => {
    const wrapper = mountWith(true);
    expect(wrapper.findAll('thead th').map((cell) => cell.text())).toContain('Xếp hạng');
    expect(wrapper.find('tbody a[href$="/best"]').exists()).toBe(true);
  });

  it('drops the column and the links when the ranking is hidden from the viewer', () => {
    const wrapper = mountWith(false);
    expect(wrapper.findAll('thead th').map((cell) => cell.text())).not.toContain('Xếp hạng');
    expect(wrapper.find('a[href$="/best"]').exists()).toBe(false);
  });
});
