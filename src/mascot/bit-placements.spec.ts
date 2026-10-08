import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BitLoop from '@/components/BitLoop.vue';
import type { BitKind } from '@/mascot/bit-frames';
import {
  contestItem,
  profile,
  ratingHistory,
  sessionUser,
  signedIn,
  submissionDetail,
  userPage,
} from '@/test/fixtures';
import { installFakeEventSource } from '@/test/fake-event-source';
import {
  anonymousViewer,
  problemPageRoutes,
  signedInViewer,
  submissionPageRoutes,
} from '@/test/problem-routes';
import { stubMatchMedia } from '@/test/match-media';
import { mockApi, ok, page } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

/** The drawn pixels of a Bit, so a placement can be told apart by its kind without knowing its markup. */
const pixelsOf = (element: Element) => element.querySelector('.grid')?.innerHTML;
const pixelsOfKind = (kind: BitKind) => {
  const reference = mount(BitLoop, { props: { kind } });
  const html = pixelsOf(reference.element)!;
  reference.unmount();
  return html;
};

const homeRoutes = (overrides: Record<string, MockHandler> = {}): Record<string, MockHandler> => ({
  'GET /auth/me': signedIn(),
  'GET /profile': ok(profile()),
  'GET /users/user_01': ok(userPage()),
  'GET /users/user_01/ratings': ok(ratingHistory()),
  'GET /submissions': page([]),
  'GET /contests': page([contestItem()]),
  'GET /users': page([]),
  ...overrides,
});

describe('Bit placements', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-10-08T10:00:00Z'));
    installFakeEventSource();
    stubMatchMedia({ reducedMotion: true });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('shows the contest Bit on the home card only while a contest is running', async () => {
    mockApi(homeRoutes());
    const running = await mountApp('/');
    const bit = running.wrapper.get('[data-testid="contest-bit"]');
    expect(pixelsOf(bit.element)).toBe(pixelsOfKind('contest'));
    running.wrapper.unmount();

    mockApi(homeRoutes({ 'GET /contests': page([]) }));
    const idle = await mountApp('/');
    expect(idle.wrapper.find('[data-testid="contest-bit"]').exists()).toBe(false);
    idle.wrapper.unmount();
  });

  it('shows the rank-up Bit beside the rating only when the last contest raised it', async () => {
    mockApi(homeRoutes());
    const up = await mountApp('/');
    const bit = up.wrapper.get('[data-testid="rank-up-bit"]');
    expect(pixelsOf(bit.element)).toBe(pixelsOfKind('rankUp'));
    expect(up.wrapper.get('[data-testid="rating-row"]').element.contains(bit.element)).toBe(true);
    up.wrapper.unmount();

    mockApi(
      homeRoutes({
        'GET /users/user_01/ratings': ok(
          ratingHistory().map((entry) =>
            entry.contestKey === 'r42' ? { ...entry, rating: 1990 } : entry,
          ),
        ),
      }),
    );
    const down = await mountApp('/');
    expect(down.wrapper.get('[data-testid="rating-row"]').text()).toContain('-28');
    expect(down.wrapper.find('[data-testid="rank-up-bit"]').exists()).toBe(false);
    down.wrapper.unmount();
  });

  it('shows the judging Bit on a submission that is still being graded, and a verdict Bit once final', async () => {
    const grading = submissionDetail({
      status: 'G',
      result: null,
      points: null,
      casePoints: 7,
      caseTotal: 20,
      currentTestcase: 3,
    });
    mockApi({ ...signedInViewer(), ...submissionPageRoutes(grading), ...problemPageRoutes() });
    const pending = await mountApp('/submissions/sub-1');
    await vi.waitFor(() =>
      expect(pending.wrapper.find('[data-testid="score"]').exists()).toBe(true),
    );
    const judging = pending.wrapper.get('[data-testid="judging-bit"]');
    expect(judging.attributes('aria-hidden')).toBe('true');
    expect(pixelsOf(judging.element)).toBe(pixelsOfKind('judging'));
    expect(pending.wrapper.find('[role="img"][aria-label="Bit đội vương miện"]').exists()).toBe(
      false,
    );
    pending.wrapper.unmount();

    const accepted = submissionDetail({ status: 'D', result: 'AC', points: 1000 });
    mockApi({ ...signedInViewer(), ...submissionPageRoutes(accepted), ...problemPageRoutes() });
    const final = await mountApp('/submissions/sub-1');
    await vi.waitFor(() => expect(final.wrapper.find('[data-testid="score"]').exists()).toBe(true));
    expect(final.wrapper.find('[data-testid="judging-bit"]').exists()).toBe(false);
    expect(final.wrapper.find('[role="img"][aria-label="Bit đội vương miện"]').exists()).toBe(true);
    final.wrapper.unmount();
  });

  it('shows the staff hard hat on the admin area for staff only', async () => {
    mockApi({
      ...signedInViewer(),
      'GET /auth/me': signedIn({ user: sessionUser({ isStaff: true }) }),
    });
    const staff = await mountApp('/admin');
    expect(pixelsOf(staff.wrapper.get('[data-testid="inline-bit"]').element)).toBe(
      pixelsOfKind('staff'),
    );
    staff.wrapper.unmount();

    mockApi(signedInViewer());
    const member = await mountApp('/admin');
    expect(member.wrapper.find('[data-testid="inline-bit"]').exists()).toBe(false);
    member.wrapper.unmount();
  });
});
