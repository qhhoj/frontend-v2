import type { PermissionRule } from '@/lib/permissions';

export interface AdminScreen {
  path: string;
  /** `null`: any staff member. */
  permission: PermissionRule | null;
}

/** The backend's `canEdit` needs `edit_own_problem` for every edit; `edit_all_problem` only widens which problems. */
const PROBLEM_EDIT = 'judge.edit_own_problem';
const CONTEST_EDIT = ['judge.edit_own_contest', 'judge.edit_all_contest'] as const;
const problemTab = (tab: string): AdminScreen => ({
  path: `/admin/problems/:code/${tab}`,
  permission: PROBLEM_EDIT,
});
const contestTab = (tab: string): AdminScreen => ({
  path: `/admin/contests/:key/${tab}`,
  permission: CONTEST_EDIT,
});

/** Every admin screen of plans 8f-1 and 8f-2. Ids are camelCase; route names are `admin-<id>`; titles `admin.shell.screens.<id>`. */
export const ADMIN_SCREENS = {
  dashboard: { path: '/admin', permission: null },
  problems: { path: '/admin/problems', permission: ['judge.add_problem', PROBLEM_EDIT] },
  problemNew: {
    path: '/admin/problems/new',
    permission: ['judge.add_problem', 'judge.suggest_new_problem'],
  },
  polygonImport: { path: '/admin/problems/polygon', permission: 'judge.import_polygon_package' },
  problemImport: { path: '/admin/problems/import', permission: 'judge.import_polygon_package' },
  problemGeneral: problemTab('general'),
  problemStatements: problemTab('statements'),
  problemEditorial: problemTab('editorial'),
  problemData: problemTab('data'),
  problemFiles: problemTab('files'),
  types: {
    path: '/admin/types',
    permission: ['judge.change_problemtype', 'judge.change_problemgroup', 'judge.change_license'],
  },
  contests: { path: '/admin/contests', permission: ['judge.add_contest', ...CONTEST_EDIT] },
  contestNew: { path: '/admin/contests/new', permission: 'judge.add_contest' },
  contestTags: { path: '/admin/contest-tags', permission: 'judge.change_contest_tag' },
  contestGeneral: contestTab('general'),
  contestProblems: contestTab('problems'),
  contestAnnouncements: contestTab('announcements'),
  contestRanking: contestTab('ranking'),
  contestActions: contestTab('actions'),
  contestParticipants: contestTab('participants'),
  contestGhosts: contestTab('ghosts'),
  contestData: contestTab('data'),
  similarity: { path: '/admin/similarity', permission: 'judge.moss_contest' },
  similarityPairs: {
    path: '/admin/similarity/runs/:runId/pairs',
    permission: 'judge.moss_contest',
  },
  similarityPair: { path: '/admin/similarity/pairs/:pairId', permission: 'judge.moss_contest' },
  rejudge: { path: '/admin/rejudge', permission: 'judge.rejudge_submission' },
  submissions: {
    path: '/admin/submissions',
    permission: [
      'judge.rejudge_submission',
      'judge.reject_submission',
      'judge.abort_any_submission',
    ],
  },
  // Plan 8f-2 screens
  judges: { path: '/admin/judges', permission: 'judge.change_judge' },
  judgeNew: { path: '/admin/judges/new', permission: 'judge.change_judge' },
  // Backend `LanguagesAdminController`: list and update need `change_language`, create needs `add_language`.
  languages: {
    path: '/admin/languages',
    permission: ['judge.change_language', 'judge.add_language'],
  },
  languageNew: { path: '/admin/languages/new', permission: 'judge.add_language' },
  languageEdit: { path: '/admin/languages/:key', permission: 'judge.change_language' },
  users: { path: '/admin/users', permission: 'judge.ban_user' },
  organizations: {
    path: '/admin/organizations',
    permission: ['judge.edit_all_organization', 'judge.add_organization'],
  },
  posts: { path: '/admin/posts', permission: 'judge.edit_all_post' },
  commentReports: { path: '/admin/comments/reports', permission: 'judge.change_comment' },
  comments: { path: '/admin/comments', permission: 'judge.change_comment' },
  tickets: { path: '/admin/tickets', permission: 'judge.change_ticket' },
  cannedReplies: { path: '/admin/tickets/canned', permission: 'judge.change_ticket' },
  activity: { path: '/admin/activity', permission: 'judge.can_see_user_activity' },
  settings: { path: '/admin/settings', permission: 'judge.change_settings' },
  config: { path: '/admin/config', permission: 'judge.change_miscconfig' },
  pages: { path: '/admin/pages', permission: 'flatpages.change_flatpage' },
  log: { path: '/admin/log', permission: 'judge.change_settings' },
  shortLinks: { path: '/admin/short-links', permission: 'judge.manage_short_link' },
  integrations: { path: '/admin/integrations', permission: 'judge.manage_integration' },
  problemsDeleted: { path: '/admin/problems/deleted', permission: 'judge.delete_problem' },
  organizationQuotas: {
    path: '/admin/organizations/quotas',
    permission: 'judge.edit_all_organization',
  },
} as const satisfies Record<string, AdminScreen>;

export type AdminScreenId = keyof typeof ADMIN_SCREENS;
export const adminRouteName = (id: AdminScreenId) => `admin-${id}`;
