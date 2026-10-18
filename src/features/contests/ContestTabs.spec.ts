import { describe, expect, it } from 'vitest';
import { contestDetail, contestViewer, ranking } from '@/test/fixtures';
import { contestPageRoutes } from '@/test/contest-routes';
import { fail, mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, signedInViewer } from '@/test/problem-routes';
import { endedContest } from '@/test/replay-fixtures';
import { staffViewer } from '@/test/admin-routes';

describe('contest tabs', () => {
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
  }, 20_000);
});

describe('contest tabs manage link', () => {
  const manageHref = (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper']) =>
    wrapper.find('[data-testid="contest-manage-tab"]').attributes('href');
  const editor = () => staffViewer(['judge.edit_own_contest']);
  const editable = contestDetail({ viewer: contestViewer({ canEdit: true }) });

  it('opens the editor tab of the page an editor is on', async () => {
    mockApi({ ...editor(), ...contestPageRoutes(editable) });
    const problems = await mountApp('/contests/r42');
    expect(manageHref(problems.wrapper)).toBe('/admin/contests/r42/problems');
    problems.wrapper.unmount();
    mockApi({
      ...editor(),
      ...contestPageRoutes(editable),
      'GET /contests/r42/stats': fail(403, 'forbidden'),
    });
    const stats = await mountApp('/contests/r42/stats');
    expect(manageHref(stats.wrapper)).toBe('/admin/contests/r42/general');
  }, 20_000);

  it('is not there for a viewer who cannot edit the contest', async () => {
    mockApi({ ...editor(), ...contestPageRoutes() });
    const { wrapper } = await mountApp('/contests/r42');
    expect(wrapper.find('[data-testid="contest-manage-tab"]').exists()).toBe(false);
  });
});
