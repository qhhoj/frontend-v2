import type { RouteComponent, RouteRecordRaw } from 'vue-router';
import { ADMIN_SCREENS, adminRouteName } from './admin-screens';
import type { AdminScreenId } from './admin-screens';

type Loader = () => Promise<RouteComponent | { default: RouteComponent }>;
const placeholder: Loader = () => import('./shell/AdminPlaceholder.vue');

/** One line per screen: each screen task swaps only its own line (records are separated, so merges stay clean). */
const SCREEN_COMPONENTS: Record<AdminScreenId, Loader> = {
  dashboard: () => import('./shell/AdminDashboard.vue'),
  problems: () => import('./problems/ProblemsIndexPage.vue'),
  problemNew: () => import('./problems/general/ProblemCreatePage.vue'),
  problemImport: () => import('./problems/import/PolygonImportPage.vue'),
  problemGeneral: () => import('./problems/ProblemEditorPage.vue'),
  problemStatements: () => import('./problems/ProblemEditorPage.vue'),
  problemEditorial: () => import('./problems/ProblemEditorPage.vue'),
  problemData: () => import('./problems/ProblemEditorPage.vue'),
  problemFiles: () => import('./problems/ProblemEditorPage.vue'),
  types: placeholder,
  contests: () => import('./contests/ContestsIndexPage.vue'),
  contestNew: () => import('./contests/general/ContestCreatePage.vue'),
  contestTags: () => import('./contest-tags/ContestTagsPage.vue'),
  contestGeneral: () => import('./contests/ContestEditorPage.vue'),
  contestProblems: () => import('./contests/ContestEditorPage.vue'),
  contestAnnouncements: () => import('./contests/ContestEditorPage.vue'),
  contestRanking: () => import('./contests/ContestEditorPage.vue'),
  contestActions: () => import('./contests/ContestEditorPage.vue'),
  contestParticipants: () => import('./contests/ContestEditorPage.vue'),
  contestGhosts: () => import('./contests/ContestEditorPage.vue'),
  contestData: () => import('./contests/ContestEditorPage.vue'),
  similarity: () => import('./similarity/SimilarityRunsPage.vue'),
  similarityPairs: () => import('./similarity/SimilarityPairsPage.vue'),
  similarityPair: () => import('./similarity/SimilarityPairPage.vue'),
  rejudge: () => import('./rejudge/BulkRejudgePage.vue'),
  judges: () => import('./judges/JudgesPage.vue'),
  judgeNew: () => import('./judges/JudgeAddPage.vue'),
  languages: () => import('./languages/LanguagesPage.vue'),
  languageNew: () => import('./languages/LanguageFormPage.vue'),
  languageEdit: () => import('./languages/LanguageFormPage.vue'),
  users: () => import('./users/UsersPage.vue'),
  organizations: () => import('./organizations/OrganizationsPage.vue'),
  posts: () => import('./posts/BlogModerationPage.vue'),
  tickets: () => import('./tickets/TicketQueuePage.vue'),
  cannedReplies: () => import('./canned-replies/CannedRepliesPage.vue'),
  activity: () => import('./activity/UserActivityPage.vue'),
  settings: () => import('./settings/SiteSettingsPage.vue'),
  config: () => import('./site/MiscConfigPage.vue'),
  pages: () => import('./pages/FlatpagesPage.vue'),
  log: () => import('./settings/AdminLogPage.vue'),
  shortLinks: () => import('./short-links/ShortLinksPage.vue'),
  integrations: () => import('./integrations/IntegrationClientsPage.vue'),
  problemsDeleted: () => import('./problems/lifecycle/DeletedProblemsPage.vue'),
  organizationQuotas: () => import('./organizations/quotas/QuotaOverviewPage.vue'),
};

const ADMIN_META = { requiresAuth: true, staffOnly: true, layout: 'admin' } as const;

const screenRoute = (id: AdminScreenId): RouteRecordRaw => ({
  path: ADMIN_SCREENS[id].path,
  name: adminRouteName(id),
  component: SCREEN_COMPONENTS[id],
  meta: {
    ...ADMIN_META,
    titleKey: `admin.shell.screens.${id}`,
    permission: ADMIN_SCREENS[id].permission ?? undefined,
  },
});

export const adminRoutes: RouteRecordRaw[] = [
  ...(Object.keys(ADMIN_SCREENS) as AdminScreenId[]).map(screenRoute),
  { path: '/admin/problems/:code', redirect: { name: 'admin-problemGeneral' } },
  { path: '/admin/contests/:key', redirect: { name: 'admin-contestGeneral' } },
  {
    path: '/admin/:pathMatch(.*)*',
    name: 'admin-unknown',
    component: () => import('@/features/not-found/NotFoundPage.vue'),
    meta: { ...ADMIN_META, titleKey: 'pages.notFound' },
  },
];
