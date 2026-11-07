// An empty state offers one next step (docs/design-language.md, Rules): every `<EmptyState>` fills its `#action` slot (a
// filtered list: "Xóa bộ lọc"; a list the viewer can add to: "Tạo <đối tượng>"; else a way on, such as "Xem tất cả").
// BASELINE counts, per file, the empty states that had none when the rule was added (2026-11-07): a file may not go above
// its count, and scripts/empty-actions.spec.ts fails when a count is higher than the file's real number (lower it) or when
// the counts add up to more than on that day, so the list only shrinks. An empty state that rightly has no next step goes
// in EXCEPTIONS with the reason.

/** An opening EmptyState tag (PascalCase or kebab-case), over lines; a `>` inside a quoted attribute value does not end it. */
const OPEN_TAG = /<(EmptyState|empty-state)\b(?:"[^"]*"|'[^']*'|[^>"'])*>/g;
const COMMENT = /<!--[\s\S]*?-->/g;
/** An `action` slot template: self-closing, or its content up to the first closing template tag. */
const ACTION_TEMPLATE =
  /<template\b(?:"[^"]*"|'[^']*'|[^>"'])*?(?:#|v-slot:)action\b(?:"[^"]*"|'[^']*'|[^>"'])*?(\/>|>([\s\S]*?)<\/template>)/g;

/** Actionless empty states per file (path under src/) on 2026-11-07. Only ever lower a count or drop a line. */
export const BASELINE = {
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

/** Empty states that rightly offer no next step, by file, with the reason. */
export const EXCEPTIONS = {};

const lineOf = (source, index) => source.slice(0, index).split('\n').length;

/** Whether an EmptyState body fills its `action` slot with something (comments do not count). */
const hasAction = (body) =>
  [...body.replace(COMMENT, '').matchAll(ACTION_TEMPLATE)].some(
    (match) => match[1] !== '/>' && match[2].trim() !== '',
  );

/** Every EmptyState tag of one .vue file that offers no next step, as `{ line, text }`. */
export function actionlessEmptyStates(source, rel) {
  if (!rel.endsWith('.vue')) return [];
  const template = source.replace(COMMENT, (comment) => comment.replace(/[^\n]/g, ' '));
  return [...template.matchAll(OPEN_TAG)].flatMap((match) => {
    const bodyStart = match.index + match[0].length;
    const bodyEnd = template.indexOf(`</${match[1]}>`, bodyStart);
    const isSelfClosing = match[0].endsWith('/>');
    const body = isSelfClosing || bodyEnd < 0 ? '' : template.slice(bodyStart, bodyEnd);
    if (hasAction(body)) return [];
    return [{ line: lineOf(template, match.index), text: match[0].slice(0, 40) }];
  });
}

/** The lint finding of one file: its actionless empty states when there are more than its baseline allows. */
export function emptyStateOffences(source, rel) {
  if (rel in EXCEPTIONS) return [];
  const found = actionlessEmptyStates(source, rel);
  const allowed = BASELINE[rel] ?? 0;
  if (found.length <= allowed) return [];
  return found.map((offence) => ({
    ...offence,
    text: `${offence.text} (${found.length} > ${allowed} allowed)`,
  }));
}
