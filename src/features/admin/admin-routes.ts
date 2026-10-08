import type { RouteComponent, RouteRecordRaw } from 'vue-router';
import { ADMIN_SCREENS, adminRouteName } from './admin-screens';
import type { AdminScreenId } from './admin-screens';

type Loader = () => Promise<RouteComponent | { default: RouteComponent }>;
const placeholder: Loader = () => import('./shell/AdminPlaceholder.vue');

/** One line per screen: each screen task swaps only its own line (records are separated, so merges stay clean). */
const SCREEN_COMPONENTS: Record<AdminScreenId, Loader> = {
  dashboard: () => import('./shell/AdminDashboard.vue'),
  problems: placeholder,
  problemNew: placeholder,
  problemImport: placeholder,
  problemGeneral: placeholder,
  problemStatements: placeholder,
  problemEditorial: placeholder,
  problemData: placeholder,
  problemFiles: placeholder,
  types: placeholder,
  contests: placeholder,
  contestNew: placeholder,
  contestGeneral: placeholder,
  contestProblems: placeholder,
  contestAnnouncements: placeholder,
  contestRanking: placeholder,
  contestActions: placeholder,
  contestParticipants: placeholder,
  similarity: placeholder,
  similarityPairs: placeholder,
  similarityPair: placeholder,
  rejudge: placeholder,
  judges: placeholder,
  judgeNew: placeholder,
  languages: placeholder,
  users: placeholder,
  organizations: placeholder,
  posts: placeholder,
  tickets: placeholder,
  activity: placeholder,
  settings: placeholder,
  config: placeholder,
  nav: placeholder,
  pages: placeholder,
  log: placeholder,
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
