import { describe, expect, it, vi } from 'vitest';
import { contestDetail, contestProblem, contestViewer, submissionItem } from '@/test/fixtures';
import { mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';

describe('contest best submissions score', () => {
  it('prints the contest score over the contest maximum', async () => {
    // The problem is worth 100 on the site and 300 in this contest.
    const contest = contestDetail({
      key: 'r42',
      phase: 'ended',
      startTime: '2026-10-01T08:00:00Z',
      endTime: '2026-10-01T11:00:00Z',
      formatName: 'ioi',
      frozenLastMinutes: 0,
      problems: [contestProblem(0, { points: 300, partial: true })],
      viewer: contestViewer({ canSeeFullScoreboard: true }),
    });
    const rows = [
      // Full marks: 100 of 100 on the problem, 300 of 300 in the contest.
      submissionItem({
        id: 'full',
        user: { id: 'u1', username: 'alice', rating: null },
        problem: { code: 'r42a', name: 'Dãy số đẹp', isDeleted: false, points: 100 },
        points: 100,
        contest: { key: 'r42', name: contest.name, points: 300, minute: null },
      }),
      // Half marks: 50 of 100 on the problem, 150 of 300 in the contest.
      submissionItem({
        id: 'half',
        user: { id: 'u2', username: 'bob', rating: null },
        problem: { code: 'r42a', name: 'Dãy số đẹp', isDeleted: false, points: 100 },
        points: 50,
        result: 'WA',
        contest: { key: 'r42', name: contest.name, points: 150, minute: null },
      }),
    ];
    mockApi({
      ...anonymousViewer,
      'GET /contests/r42': ok(contest),
      'GET /contests/r42/problems/r42a/best-submissions': page(rows),
      'GET /contests/r42/announcements': page([]),
    });
    const { wrapper } = await mountApp('/contests/r42/problems/r42a/best');
    await vi.waitFor(() => expect(wrapper.findAll('tbody tr').length).toBe(2));
    const scores = wrapper
      .findAll('tbody tr')
      .map((row) => row.find('a[href^="/submissions/"] span:nth-child(2)').text());
    expect(scores).toEqual(['300 / 300', '150 / 300']);
  });
});
