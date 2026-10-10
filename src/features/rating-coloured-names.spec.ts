import { describe, expect, it } from 'vitest';
import { postItem } from '@/test/community-fixtures';
import { blogListRoutes, communityHomeRoutes } from '@/test/community-routes';
import { balloon } from '@/test/contest-extras-fixtures';
import { contestDetail, ranking, rankingRow, sessionUser, submissionItem } from '@/test/fixtures';
import { ticketItem } from '@/test/community-fixtures';
import { mockApi, page } from '@/test/mock-api';
import { mountApp, mountComponent } from '@/test/mount';
import { anonymousViewer, signedInViewer, submissionListRoutes } from '@/test/problem-routes';
import BalloonRow from './contests/balloons/BalloonRow.vue';
import RankingTable from './contests/RankingTable.vue';
import TicketTable from './tickets/TicketTable.vue';
import ContestHeaderCard from './contests/ContestHeaderCard.vue';

const author = (username: string, rating: number | null) => ({
  id: `id-${username}`,
  username,
  rating,
});

describe('usernames take the colour of the rating tier', () => {
  it('post authors in the blog list, by tier (2450 grandmaster, 1650 expert, unrated none)', async () => {
    mockApi({
      ...anonymousViewer,
      ...communityHomeRoutes,
      ...blogListRoutes,
      'GET /posts': page([
        postItem({ id: 'p1', authors: [author('gm', 2450)] }),
        postItem({ id: 'p2', authors: [author('sp', 1650)] }),
        postItem({ id: 'p3', authors: [author('un', null)] }),
      ]),
    });
    const { wrapper } = await mountApp('/blog');
    const classesOf = (name: string) =>
      wrapper
        .findAll('[data-testid="post-row"] a')
        .find((link) => link.text() === name)!
        .classes();
    expect(classesOf('gm')).toContain('text-tier-grandmaster');
    expect(classesOf('sp')).toContain('text-tier-expert');
    expect(classesOf('un')).toContain('text-tier-none');
  });

  it('contest authors in the header card', () => {
    const header = mountComponent(ContestHeaderCard, {
      props: { contest: contestDetail({ authors: [author('thayhung', 2150)] }) },
    });
    const link = header.findAll('a').find((anchor) => anchor.text() === 'thayhung')!;
    expect(link.classes()).toContain('text-tier-candidate-master');
  });

  it('the team of a balloon row', () => {
    const row = mountComponent(BalloonRow, {
      props: {
        balloon: balloon(0, { team: { userId: 'u1', username: 'ann', rating: 1450 } }),
        isBusy: false,
      },
    });
    expect(row.get('p.font-semibold').classes()).toContain('text-tier-specialist');
  });

  it('the signed-in user in the menu', async () => {
    mockApi({ ...blogListRoutes, ...signedInViewer({ user: sessionUser({ rating: 1950 }) }) });
    const { wrapper } = await mountApp('/blog');
    const name = wrapper.get('button[aria-haspopup="menu"] span');
    expect(name.classes()).toContain('text-tier-candidate-master');
  });

  it('names in the contest ranking table', () => {
    const rated = rankingRow(1, 'part-a', 'gm_user', 2, 40, {});
    rated.user.rating = 2450;
    const unrated = rankingRow(2, 'part-b', 'new_user', 1, 20, {});
    const board = ranking();
    const table = mountComponent(RankingTable, {
      props: {
        ranking: board,
        rows: [rated, unrated],
        context: { formatName: 'icpc', pointsPrecision: 0, locale: 'vi', showsTime: true },
        viewerId: null,
      },
    });
    const classesOf = (name: string) =>
      table
        .findAll('tbody a')
        .find((link) => link.text() === name)!
        .classes();
    expect(classesOf('gm_user')).toContain('text-tier-grandmaster');
    expect(classesOf('new_user')).toContain('text-tier-none');
  });

  it('the author in the submissions table', async () => {
    mockApi({
      ...anonymousViewer,
      ...submissionListRoutes,
      'GET /submissions': page([
        submissionItem({ id: 's1', user: author('master_user', 2250) }),
        submissionItem({ id: 's2', user: author('pupil_user', 1250) }),
      ]),
    });
    const { wrapper } = await mountApp('/submissions');
    const classesOf = (name: string) =>
      wrapper
        .findAll('tbody a')
        .find((link) => link.text() === name)!
        .classes();
    expect(classesOf('master_user')).toContain('text-tier-master');
    expect(classesOf('pupil_user')).toContain('text-tier-pupil');
  });

  it('the assignees in the ticket table', () => {
    const table = mountComponent(TicketTable, {
      props: {
        tickets: [ticketItem({ assignees: [author('staff_a', 1650), author('staff_b', null)] })],
      },
    });
    const classesOf = (name: string) =>
      table
        .findAll('a')
        .find((link) => link.text() === name)!
        .classes();
    expect(classesOf('staff_a')).toContain('text-tier-expert');
    expect(classesOf('staff_b')).toContain('text-tier-none');
  });
});
