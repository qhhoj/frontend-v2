import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  BASELINE,
  EXCEPTIONS,
  actionlessEmptyStates,
  emptyStateOffences,
  // @ts-expect-error plain .mjs module without types
} from './empty-actions.mjs';

type Offence = { line: number; text: string };
const lines = (source: string, rel = 'features/x/XPage.vue'): number[] =>
  (actionlessEmptyStates(source, rel) as Offence[]).map((found) => found.line);
const baseline = BASELINE as Record<string, number>;
/**
 * BASELINE as it was on 2026-11-07, kept here so that a new file or a higher count in BASELINE fails: the baseline only
 * shrinks. Edit this copy only to remove a line.
 */
const FIRST_BASELINE: Record<string, number> = {
  'features/account/security/SecurityKeys.vue': 1,
  'features/admin/contests/announcements/ContestAnnouncementsTab.vue': 1,
  'features/admin/contests/ghosts/GhostCurrentCard.vue': 1,
  'features/admin/contests/ranking/OfficialRankingCard.vue': 1,
  'features/admin/search/ProblemSearchList.vue': 1,
  'features/admin/shell/search/AdminCommandPalette.vue': 1,
  'features/admin/users/UsersPage.vue': 1,
  'features/comments/CommentsSection.vue': 1,
  'features/community/RecentCommentsCard.vue': 1,
  'features/contests/balloons/BalloonsPage.vue': 1,
  'features/contests/balloons/BalloonsPrintPage.vue': 1,
  'features/contests/best/ContestBestPage.vue': 1,
  'features/contests/ContestAnnouncementsPage.vue': 1,
  'features/contests/ContestAnnouncementsRail.vue': 1,
  'features/contests/ContestListEmpty.vue': 1,
  'features/contests/ContestRankingPage.vue': 1,
  'features/contests/PublicRankingPage.vue': 2,
  'features/contests/replay/ReplayEventFeed.vue': 1,
  'features/home/RecentSubmissionsList.vue': 1,
  'features/notifications/NotificationBell.vue': 1,
  'features/notifications/NotificationsPage.vue': 2,
  'features/organizations/OrganizationAbout.vue': 1,
  'features/organizations/OrganizationContestsPage.vue': 1,
  'features/organizations/problems/OrgProblemsPage.vue': 1,
  'features/organizations/quota/CreditLedger.vue': 1,
  'features/problems/NoStatement.vue': 1,
  'features/profile/ProfileBlogTab.vue': 1,
  'features/profile/ProfileCommentsTab.vue': 1,
  'features/profile/ProfilePpTab.vue': 1,
  'features/profile/ProfileSolvedTab.vue': 1,
  'features/submissions/BestSubmissionsPage.vue': 1,
  'features/tickets/canned/CannedReplyPicker.vue': 1,
  'features/tickets/TicketsPage.vue': 1,
};

describe('actionlessEmptyStates', () => {
  it('flags an empty state with no next step, self-closing or not', () => {
    expect(lines(`<div>\n  <EmptyState>Chưa có gì.</EmptyState>\n</div>`)).toEqual([2]);
    expect(lines(`<EmptyState compact />`)).toEqual([1]);
  });

  it('accepts one whose action slot is filled, in either slot syntax', () => {
    expect(
      lines(
        `<EmptyState :kind="k">\n  Trống.\n  <template #action><AppButton /></template>\n</EmptyState>`,
      ),
    ).toEqual([]);
    expect(lines(`<EmptyState><template v-slot:action>x</template></EmptyState>`)).toEqual([]);
  });

  it('judges each empty state of a file on its own', () => {
    const source = `<EmptyState>A<template #action>x</template></EmptyState>\n<EmptyState>B</EmptyState>`;
    expect(lines(source)).toEqual([2]);
  });

  it('flags the kebab-case tag too', () => {
    expect(lines(`<empty-state>Trống.</empty-state>`)).toEqual([1]);
  });

  it('does not count an action slot inside a comment, or an empty one', () => {
    expect(lines(`<EmptyState>Trống.<!-- <template #action>x</template> --></EmptyState>`)).toEqual(
      [1],
    );
    expect(lines(`<EmptyState>Trống.<template #action /></EmptyState>`)).toEqual([1]);
  });

  it('leaves non-vue files alone', () => {
    expect(lines(`const html = '<EmptyState>A</EmptyState>';`, 'features/x/x.ts')).toEqual([]);
  });
});

describe('emptyStateOffences', () => {
  const two = `<EmptyState>A</EmptyState>\n<EmptyState>B</EmptyState>`;

  it('lets a listed file keep its count but not add one', () => {
    const [rel] = Object.entries(baseline).find(([, count]) => count === 1)!;
    expect(emptyStateOffences(`<EmptyState>A</EmptyState>`, rel)).toEqual([]);
    expect((emptyStateOffences(two, rel) as Offence[]).map((found) => found.line)).toEqual([1, 2]);
  });

  it('allows none in an unlisted file', () => {
    expect(emptyStateOffences(`<EmptyState>A</EmptyState>`, 'features/x/XPage.vue')).toHaveLength(
      1,
    );
  });
});

describe('the baseline of empty states without a next step', () => {
  it('counts exactly what each listed file still has, so a fixed one must be lowered', () => {
    const wrong = Object.entries(baseline).filter(([rel, count]) => {
      const path = `src/${rel}`;
      if (!existsSync(path)) return true;
      return actionlessEmptyStates(readFileSync(path, 'utf8'), rel).length !== count;
    });
    expect(wrong).toEqual([]);
  });

  it('never gains a file or a count; a rightful exception goes in EXCEPTIONS with a reason', () => {
    const grown = Object.entries(baseline).filter(
      ([rel, count]) => count > (FIRST_BASELINE[rel] ?? 0),
    );
    expect(grown).toEqual([]);
    for (const reason of Object.values(EXCEPTIONS as Record<string, string>)) {
      expect(reason.trim()).not.toBe('');
    }
  });
});
