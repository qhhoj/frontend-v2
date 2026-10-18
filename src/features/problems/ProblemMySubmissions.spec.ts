import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { useSessionStore } from '@/stores/session.store';
import { sessionUser, submissionItem } from '@/test/fixtures';
import { mockApi, page } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import ProblemMySubmissions from './ProblemMySubmissions.vue';
import type { ScoreScale } from './submit-result';

const inRound: ScoreScale = {
  problemPoints: 1600,
  contest: { key: 'r42', points: 250, partial: false, precision: 0 },
};
const practice: ScoreScale = { problemPoints: 1600, contest: null };
const made = (key: string, points: number | null) => ({
  key,
  name: `Round ${key}`,
  points,
  minute: 12,
});

async function railRows(items: ReturnType<typeof submissionItem>[], scale: ScoreScale) {
  mockApi({ 'GET /submissions': page(items) });
  const wrapper = mountComponent(ProblemMySubmissions, { props: { code: 'aplusb', scale } });
  const session = useSessionStore();
  session.user = sessionUser();
  session.status = 'authenticated';
  await flushPromises();
  return wrapper.findAll('li').map((row) => ({
    text: row.get('[data-scale]').text(),
    scale: row.get('[data-scale]').attributes('data-scale'),
  }));
}

describe('rail "Bài nộp của tôi"', () => {
  it("scores a contest submission on the contest's points and a practice one on the problem's", async () => {
    const rows = await railRows(
      [
        submissionItem({ id: 'c', points: 800, contest: made('r42', 250) }),
        submissionItem({ id: 'p', points: 800, contest: null }),
      ],
      inRound,
    );
    expect(rows).toEqual([
      { text: '250 / 250 điểm kỳ thi', scale: 'contest' },
      { text: '800 / 1600 điểm bài', scale: 'site' },
    ]);
  });

  it('marks a practice row as the problem scale outside a contest too', async () => {
    const rows = await railRows([submissionItem({ points: 1600, contest: null })], practice);
    expect(rows).toEqual([{ text: '1600 / 1600 điểm bài', scale: 'site' }]);
  });

  it("gives another contest's submission its points without a maximum it cannot know", async () => {
    const rows = await railRows(
      [submissionItem({ points: 1600, contest: made('r41', 120.5) })],
      inRound,
    );
    expect(rows).toEqual([{ text: '120,5 điểm kỳ thi', scale: 'contest' }]);
  });

  it('shows a dash for a contest row whose points are not there yet', async () => {
    const rows = await railRows(
      [
        submissionItem({
          id: 'u',
          status: 'QU',
          result: null,
          points: null,
          contest: made('r42', null),
        }),
        submissionItem({ id: 'j', points: 1600, contest: made('r42', null) }),
      ],
      inRound,
    );
    expect(rows).toEqual([
      { text: '– / 250 điểm kỳ thi', scale: 'contest' },
      { text: '1600 / 1600 điểm bài', scale: 'site' },
    ]);
  });
});
