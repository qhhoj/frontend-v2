import type { RouteRecordRaw } from 'vue-router';

/** Screens without an approved mock-up render this until their plan lands. */
const PlaceholderPage = () => import('@/components/PlaceholderPage.vue');

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/features/home/HomePage.vue'),
    meta: { titleKey: 'nav.home' },
  },
  {
    path: '/problems',
    name: 'problems',
    component: () => import('@/features/problems/ProblemsPage.vue'),
    meta: { titleKey: 'nav.problems' },
  },
  {
    path: '/problems/:code',
    name: 'problem',
    component: () => import('@/features/problems/ProblemPage.vue'),
    meta: { titleKey: 'pages.problem' },
  },
  {
    path: '/submissions',
    name: 'submissions',
    component: () => import('@/features/submissions/SubmissionsPage.vue'),
    meta: { titleKey: 'pages.submissions' },
  },
  {
    path: '/submissions/:id',
    name: 'submission',
    component: () => import('@/features/submissions/SubmissionPage.vue'),
    meta: { titleKey: 'pages.submission', requiresAuth: true },
  },
  {
    path: '/contests',
    name: 'contests',
    component: () => import('@/features/contests/ContestsPage.vue'),
    meta: { titleKey: 'nav.contests' },
  },
  {
    path: '/contests/:key',
    name: 'contest',
    component: () => import('@/features/contests/ContestPage.vue'),
    meta: { titleKey: 'pages.contest' },
  },
  {
    path: '/contests/:key/announcements',
    name: 'contest-announcements',
    component: () => import('@/features/contests/ContestAnnouncementsPage.vue'),
    meta: { titleKey: 'pages.contestAnnouncements' },
  },
  {
    path: '/contests/:key/submissions',
    name: 'contest-submissions',
    component: () => import('@/features/contests/ContestSubmissionsPage.vue'),
    meta: { titleKey: 'pages.contestSubmissions' },
  },
  {
    path: '/contests/:key/stats',
    name: 'contest-stats',
    component: () => import('@/features/contests/ContestStatsPage.vue'),
    meta: { titleKey: 'pages.contestStats' },
  },
  {
    path: '/contests/:key/ranking',
    name: 'contest-ranking',
    component: () => import('@/features/contests/ContestRankingPage.vue'),
    meta: { titleKey: 'pages.ranking' },
  },
  { path: '/users', name: 'users', component: PlaceholderPage, meta: { titleKey: 'nav.users' } },
  {
    path: '/users/:username',
    name: 'user',
    component: PlaceholderPage,
    meta: { titleKey: 'pages.user' },
  },
  {
    path: '/organizations',
    name: 'organizations',
    component: PlaceholderPage,
    meta: { titleKey: 'pages.organizations' },
  },
  {
    path: '/organizations/:slug',
    name: 'organization',
    component: PlaceholderPage,
    meta: { titleKey: 'pages.organization' },
  },
  { path: '/blog', name: 'blog', component: PlaceholderPage, meta: { titleKey: 'nav.blog' } },
  { path: '/blog/:id', name: 'post', component: PlaceholderPage, meta: { titleKey: 'pages.post' } },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/features/auth/LoginPage.vue'),
    meta: { titleKey: 'pages.login', guestOnly: true },
  },
  {
    path: '/login/2fa',
    name: 'login-2fa',
    component: () => import('@/features/auth/TwoFactorPage.vue'),
    meta: { titleKey: 'pages.twoFactor', allowPartial: true, layout: 'auth' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/features/auth/RegisterPage.vue'),
    meta: { titleKey: 'pages.register', guestOnly: true, layout: 'auth' },
  },
  {
    path: '/register/social',
    name: 'register-social',
    component: PlaceholderPage,
    meta: { titleKey: 'pages.socialSignup', guestOnly: true },
  },
  {
    path: '/activate',
    name: 'activate-resend',
    component: () => import('@/features/auth/ResendActivationPage.vue'),
    meta: { titleKey: 'pages.activateResend', guestOnly: true, layout: 'auth' },
  },
  {
    path: '/activate/:key',
    name: 'activate',
    component: () => import('@/features/auth/ActivatePage.vue'),
    meta: { titleKey: 'pages.activate', layout: 'auth' },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: PlaceholderPage,
    meta: { titleKey: 'pages.forgotPassword', guestOnly: true },
  },
  {
    path: '/reset-password/:token',
    name: 'reset-password',
    component: PlaceholderPage,
    meta: { titleKey: 'pages.resetPassword' },
  },
  {
    path: '/account/password',
    name: 'account-password',
    component: () => import('@/features/auth/ChangePasswordPage.vue'),
    meta: { titleKey: 'pages.changePassword', requiresAuth: true, layout: 'auth' },
  },
  {
    path: '/settings/appearance',
    name: 'settings-appearance',
    component: () => import('@/features/appearance/AppearancePage.vue'),
    meta: { titleKey: 'pages.appearance' },
  },
  {
    path: '/settings',
    name: 'settings',
    component: PlaceholderPage,
    meta: { titleKey: 'pages.settings', requiresAuth: true },
  },
  {
    path: '/admin/:pathMatch(.*)*',
    name: 'admin',
    component: () => import('@/features/admin/AdminPage.vue'),
    meta: { titleKey: 'pages.admin', requiresAuth: true, staffOnly: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/features/not-found/NotFoundPage.vue'),
    meta: { titleKey: 'pages.notFound' },
  },
];
