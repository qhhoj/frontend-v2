import { describe, expect, it } from 'vitest';
import { contestDetail, contestViewer, ranking } from '@/test/fixtures';
import { contestPageRoutes } from '@/test/contest-routes';
import { mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, signedInViewer } from '@/test/problem-routes';
import { endedContest } from '@/test/replay-fixtures';

describe('contest tabs', () => {
  it('links every section of the contest and marks the open one', async () => {
    mockApi({
      ...anonymousViewer,
      ...contestPageRoutes(),
      'GET /contests/r42/ranking': ok(ranking()),
    });
    const { wrapper } = await mountApp('/contests/r42/ranking');
    const nav = wrapper.get('nav[aria-label="Mục kỳ thi"]');
    const links = nav.findAll('a');
    expect(links.map((link) => [link.text(), link.attributes('href')])).toEqual([
      ['Đề bài', '/contests/r42'],
      ['Thông báo', '/contests/r42/announcements'],
      ['Bài nộp', '/contests/r42/submissions'],
      ['Thống kê', '/contests/r42/stats'],
      ['Bảng xếp hạng', '/contests/r42/ranking'],
    ]);
    expect(
      links.filter((link) => link.attributes('aria-current') === 'page').map((link) => link.text()),
    ).toEqual(['Bảng xếp hạng']);
  });

  it('adds the replay tab only once the contest has ended', async () => {
    mockApi({
      ...anonymousViewer,
      ...contestPageRoutes(endedContest()),
      'GET /contests/r41/ranking': ok(ranking({ frozen: false })),
    });
    const { wrapper } = await mountApp('/contests/r41/ranking');
    const links = wrapper.get('nav[aria-label="Mục kỳ thi"]').findAll('a');
    expect(links.map((link) => [link.text(), link.attributes('href')]).at(-1)).toEqual([
      'Phát lại',
      '/contests/r41/replay',
    ]);
  });

  it('encodes a key that needs it', async () => {
    const detail = contestDetail({ key: 'a b' });
    mockApi({
      ...anonymousViewer,
      ...contestPageRoutes(detail),
      'GET /contests/a%20b/ranking': ok(ranking()),
    });
    const { wrapper } = await mountApp('/contests/a%20b/ranking');
    expect(wrapper.get('nav[aria-label="Mục kỳ thi"] a').attributes('href')).toBe(
      '/contests/a%20b',
    );
  });
});

describe('contest tabs balloon link', () => {
  const balloonLinks = (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper']) =>
    wrapper.findAll('nav a').filter((link) => link.text() === 'Bóng bay');

  it('links the balloon queue for a viewer who may use it, keeps the replay tab, and hides it otherwise', async () => {
    mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(contestDetail({ viewer: contestViewer({ canViewBalloons: true }) })),
    });
    const first = await mountApp('/contests/r42');
    expect(balloonLinks(first.wrapper).map((link) => link.attributes('href'))).toEqual([
      '/contests/r42/balloons',
    ]);
    first.wrapper.unmount();
    mockApi({ ...signedInViewer(), ...contestPageRoutes() });
    const second = await mountApp('/contests/r42');
    expect(balloonLinks(second.wrapper)).toHaveLength(0);
  });
});
