// An empty state offers one next step (docs/design-language.md, Rules): every `<EmptyState>` fills its `#action` slot (a
// filtered list: "Xóa bộ lọc"; a list the viewer can add to: "Tạo <đối tượng>"; else a way on, such as "Xem tất cả"). The
// files below had an empty state without one when the rule was added (2026-11-07); a file leaves the list when its empty
// states gain their action, and scripts/empty-actions.spec.ts fails while an entry is stale. Never add a file without a
// reason why that empty state has no next step.

/** An opening EmptyState tag, over lines; a `>` inside a quoted attribute value does not end it. */
const OPEN_TAG = /<EmptyState\b(?:"[^"]*"|'[^']*'|[^>"'])*>/g;
const CLOSE_TAG = '</EmptyState>';
const ACTION_SLOT = /(?:#|v-slot:)action\b/;

/** The reason of every file listed when the rule was added. */
const BASELINE = 'had no next step on 2026-11-07; its area lane adds one';

/** Files allowed an EmptyState without `#action`, by path under src/, and why. */
export const ALLOWED = {
  'features/account/security/SecurityKeys.vue': BASELINE,
  'features/admin/contests/announcements/ContestAnnouncementsTab.vue': BASELINE,
  'features/admin/contests/ghosts/GhostCurrentCard.vue': BASELINE,
  'features/admin/contests/ranking/OfficialRankingCard.vue': BASELINE,
  'features/admin/search/ProblemSearchList.vue': BASELINE,
  'features/admin/shell/search/AdminCommandPalette.vue': BASELINE,
  'features/admin/users/UsersPage.vue': BASELINE,
  'features/comments/CommentsSection.vue': BASELINE,
  'features/community/RecentCommentsCard.vue': BASELINE,
  'features/contests/balloons/BalloonsPage.vue': BASELINE,
  'features/contests/balloons/BalloonsPrintPage.vue': BASELINE,
  'features/contests/best/ContestBestPage.vue': BASELINE,
  'features/contests/ContestAnnouncementsPage.vue': BASELINE,
  'features/contests/ContestAnnouncementsRail.vue': BASELINE,
  'features/contests/ContestListEmpty.vue': BASELINE,
  'features/contests/ContestRankingPage.vue': BASELINE,
  'features/contests/PublicRankingPage.vue': BASELINE,
  'features/contests/replay/ReplayEventFeed.vue': BASELINE,
  'features/home/RecentSubmissionsList.vue': BASELINE,
  'features/notifications/NotificationBell.vue': BASELINE,
  'features/notifications/NotificationsPage.vue': BASELINE,
  'features/organizations/OrganizationAbout.vue': BASELINE,
  'features/organizations/OrganizationContestsPage.vue': BASELINE,
  'features/organizations/problems/OrgProblemsPage.vue': BASELINE,
  'features/organizations/quota/CreditLedger.vue': BASELINE,
  'features/problems/NoStatement.vue': BASELINE,
  'features/profile/ProfileBlogTab.vue': BASELINE,
  'features/profile/ProfileCommentsTab.vue': BASELINE,
  'features/profile/ProfilePpTab.vue': BASELINE,
  'features/profile/ProfileSolvedTab.vue': BASELINE,
  'features/submissions/BestSubmissionsPage.vue': BASELINE,
  'features/tickets/canned/CannedReplyPicker.vue': BASELINE,
  'features/tickets/TicketsPage.vue': BASELINE,
};

const lineOf = (source, index) => source.slice(0, index).split('\n').length;

/** The EmptyState tags of one file that offer no next step, as `{ line, text }`, ignoring the allowed files. */
export function actionlessEmptyStates(source, rel) {
  if (!rel.endsWith('.vue') || rel in ALLOWED) return [];
  return [...source.matchAll(OPEN_TAG)].flatMap((match) => {
    const bodyStart = match.index + match[0].length;
    const bodyEnd = source.indexOf(CLOSE_TAG, bodyStart);
    const isSelfClosing = match[0].endsWith('/>');
    const body = isSelfClosing || bodyEnd < 0 ? '' : source.slice(bodyStart, bodyEnd);
    if (ACTION_SLOT.test(body)) return [];
    return [{ line: lineOf(source, match.index), text: match[0].slice(0, 40) }];
  });
}
