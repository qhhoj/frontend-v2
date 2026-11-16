import type { RouteRecordRaw } from 'vue-router';
import { adminRoutes } from '@/features/admin/admin-routes';
import { restoreListSetup } from '@/features/problems/problem-list-setup';
import { USER_COMMENTS_PERMISSION } from '@/features/profile/user-comments-access';

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
    beforeEnter: restoreListSetup,
  },
  {
    // The problem page is the frame: its header and tabs stay mounted while the tab changes (statement and editorial live
    // in the frame itself; the three submission tabs are the children's content).
    path: '/problems/:code',
    component: () => import('@/features/problems/ProblemPage.vue'),
    meta: { titleKey: 'pages.problem' },
    children: [
      { path: '', name: 'problem', component: { render: () => null } },
      {
        path: 'submissions',
        name: 'problem-submissions',
        component: () => import('@/features/problems/ProblemSubmissionsTab.vue'),
      },
      {
        path: 'mine',
        name: 'problem-mine',
        component: () => import('@/features/problems/ProblemSubmissionsTab.vue'),
        props: { mine: true },
        meta: { requiresAuth: true },
      },
      {
        path: 'best',
        name: 'problem-best',
        component: () => import('@/features/problems/ProblemBestTab.vue'),
      },
    ],
  },
  {
    path: '/submissions',
    name: 'submissions',
    component: () => import('@/features/submissions/SubmissionsPage.vue'),
    meta: { titleKey: 'pages.submissions' },
  },
  {
    path: '/submissions/diff',
    name: 'submission-diff',
    component: () => import('@/features/submissions/SubmissionDiffPage.vue'),
    meta: { titleKey: 'pages.submissionDiff', requiresAuth: true },
  },
  {
    path: '/submissions/:id',
    name: 'submission',
    component: () => import('@/features/submissions/SubmissionPage.vue'),
    meta: { titleKey: 'pages.submission' },
  },
  {
    path: '/paste',
    name: 'paste',
    component: () => import('@/features/shares/PastePage.vue'),
    meta: { titleKey: 'pages.paste' },
  },
  {
    path: '/c/:code',
    name: 'share',
    component: () => import('@/features/shares/SharePage.vue'),
    meta: { titleKey: 'pages.share' },
  },
  {
    path: '/runtimes',
    name: 'runtimes',
    component: () => import('@/features/runtimes/RuntimesPage.vue'),
    meta: { titleKey: 'pages.runtimes' },
  },
  {
    path: '/contests',
    name: 'contests',
    component: () => import('@/features/contests/ContestsPage.vue'),
    meta: { titleKey: 'nav.contests' },
  },
  {
    // One layout for the contest's tab pages: its header and tab strip stay mounted while the tab changes, so the tab indicator slides.
    path: '/contests/:key',
    component: () => import('@/features/contests/ContestLayout.vue'),
    children: [
      {
        path: '',
        name: 'contest',
        component: () => import('@/features/contests/ContestPage.vue'),
        meta: { titleKey: 'pages.contest' },
      },
      {
        path: 'announcements',
        name: 'contest-announcements',
        component: () => import('@/features/contests/ContestAnnouncementsPage.vue'),
        meta: { titleKey: 'pages.contestAnnouncements' },
      },
      {
        path: 'submissions',
        name: 'contest-submissions',
        component: () => import('@/features/contests/ContestSubmissionsPage.vue'),
        meta: { titleKey: 'pages.contestSubmissions' },
      },
      {
        path: 'stats',
        name: 'contest-stats',
        component: () => import('@/features/contests/ContestStatsPage.vue'),
        meta: { titleKey: 'pages.contestStats' },
      },
      {
        path: 'ranking',
        name: 'contest-ranking',
        component: () => import('@/features/contests/ContestRankingPage.vue'),
        meta: { titleKey: 'pages.ranking' },
      },
      {
        path: 'replay',
        name: 'contest-replay',
        component: () => import('@/features/contests/replay/ContestReplayPage.vue'),
        meta: { titleKey: 'pages.contestReplay' },
      },
    ],
  },
  {
    // Balloon volunteers in `balloonStaff` may be non-staff: no `adminArea`, the server answers 403/404.
    path: '/contests/:key/balloons',
    name: 'contest-balloons',
    component: () => import('@/features/contests/balloons/BalloonsPage.vue'),
    meta: { titleKey: 'pages.contestBalloons', requiresAuth: true },
  },
  {
    // The runners' sheet prints without the site header (`layout: 'auth'` draws no top bar).
    path: '/contests/:key/balloons/print',
    name: 'contest-balloons-print',
    component: () => import('@/features/contests/balloons/BalloonsPrintPage.vue'),
    meta: { titleKey: 'pages.contestBalloonsPrint', requiresAuth: true, layout: 'auth' },
  },
  {
    path: '/contests/:key/all',
    name: 'contest-all',
    component: () => import('@/features/contests/print/ContestPrintPage.vue'),
    meta: { titleKey: 'pages.contestAll' },
  },
  {
    path: '/contests/:key/problems/:code/best',
    name: 'contest-problem-best',
    component: () => import('@/features/contests/best/ContestBestPage.vue'),
    meta: { titleKey: 'pages.contestProblemBest' },
  },
  {
    path: '/public-rankings/:token',
    name: 'public-ranking',
    component: () => import('@/features/contests/PublicRankingPage.vue'),
    meta: { titleKey: 'pages.publicRanking' },
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('@/features/leaderboard/LeaderboardPage.vue'),
    meta: { titleKey: 'nav.users' },
  },
  {
    path: '/users/:username',
    name: 'user-layout',
    component: () => import('@/features/profile/ProfileLayout.vue'),
    children: [
      {
        path: '',
        name: 'user',
        component: () => import('@/features/profile/ProfileOverview.vue'),
        meta: { titleKey: 'pages.user' },
      },
      {
        path: 'solved',
        name: 'user-solved',
        component: () => import('@/features/profile/ProfileSolvedTab.vue'),
        meta: { titleKey: 'pages.user' },
      },
      {
        path: 'pp',
        name: 'user-pp',
        component: () => import('@/features/profile/ProfilePpTab.vue'),
        meta: { titleKey: 'pages.user' },
      },
      {
        path: 'blog',
        name: 'user-blog',
        component: () => import('@/features/profile/ProfileBlogTab.vue'),
        meta: { titleKey: 'pages.user' },
      },
      {
        path: 'comments',
        name: 'user-comments',
        component: () => import('@/features/profile/ProfileCommentsTab.vue'),
        meta: { titleKey: 'pages.user', notFoundWithout: USER_COMMENTS_PERMISSION },
      },
    ],
  },
  {
    path: '/organizations',
    name: 'organizations',
    component: () => import('@/features/organizations/OrganizationsPage.vue'),
    meta: { titleKey: 'pages.organizations' },
  },
  {
    path: '/organizations/:slug',
    name: 'organization-layout',
    component: () => import('@/features/organizations/OrganizationLayout.vue'),
    children: [
      {
        path: '',
        name: 'organization',
        component: () => import('@/features/organizations/OrganizationAbout.vue'),
        meta: { titleKey: 'pages.organization' },
      },
      {
        path: 'members',
        name: 'organization-members',
        component: () => import('@/features/organizations/OrganizationMembers.vue'),
        meta: { titleKey: 'pages.organization' },
      },
      {
        path: 'posts',
        name: 'organization-posts',
        component: () => import('@/features/organizations/OrganizationPosts.vue'),
        meta: { titleKey: 'pages.organization' },
      },
      // Join requests moved into "Quản lý"; old links (notifications, bookmarks) land there.
      {
        path: 'requests',
        name: 'organization-requests',
        redirect: (to) => ({ name: 'organization-manage', params: to.params }),
      },
      {
        path: 'submissions',
        name: 'organization-submissions',
        component: () => import('@/features/organizations/submissions/OrgSubmissionsPage.vue'),
        meta: { titleKey: 'pages.organization', requiresAuth: true },
      },
      {
        path: 'problems',
        name: 'organization-problems',
        component: () => import('@/features/organizations/problems/OrgProblemsPage.vue'),
        meta: { titleKey: 'pages.organization', requiresAuth: true },
      },
      {
        path: 'contests',
        name: 'organization-contests',
        component: () => import('@/features/organizations/OrganizationContestsPage.vue'),
        meta: { titleKey: 'pages.organization' },
      },
      {
        path: 'quota',
        name: 'organization-quota',
        component: () => import('@/features/organizations/quota/OrgQuotaPage.vue'),
        meta: { titleKey: 'pages.organization', requiresAuth: true },
      },
      {
        path: 'manage',
        name: 'organization-manage',
        component: () => import('@/features/organizations/OrganizationManagePage.vue'),
        meta: { titleKey: 'pages.organization', requiresAuth: true },
      },
    ],
  },
  {
    path: '/blog',
    name: 'blog',
    component: () => import('@/features/blog/BlogListPage.vue'),
    meta: { titleKey: 'nav.blog' },
  },
  {
    path: '/blog/new',
    name: 'post-new',
    component: () => import('@/features/blog/editor/PostEditorPage.vue'),
    meta: { titleKey: 'pages.postNew', requiresAuth: true },
  },
  {
    path: '/blog/drafts',
    name: 'post-drafts',
    component: () => import('@/features/blog/BlogDraftsPage.vue'),
    meta: { titleKey: 'pages.postDrafts', requiresAuth: true },
  },
  {
    path: '/blog/:id/edit',
    name: 'post-edit',
    component: () => import('@/features/blog/editor/PostEditorPage.vue'),
    meta: { titleKey: 'pages.postEdit', requiresAuth: true },
  },
  {
    path: '/blog/:id',
    name: 'post',
    component: () => import('@/features/blog/BlogPostPage.vue'),
    meta: { titleKey: 'pages.post' },
  },
  {
    path: '/tickets',
    name: 'tickets',
    component: () => import('@/features/tickets/TicketsPage.vue'),
    meta: { titleKey: 'pages.tickets', requiresAuth: true },
  },
  {
    path: '/tickets/new',
    name: 'ticket-new',
    component: () => import('@/features/tickets/NewTicketPage.vue'),
    meta: { titleKey: 'pages.ticketNew', requiresAuth: true },
  },
  {
    path: '/tickets/:id',
    name: 'ticket',
    component: () => import('@/features/tickets/TicketPage.vue'),
    meta: { titleKey: 'pages.ticket', requiresAuth: true },
  },
  {
    path: '/notifications',
    name: 'notifications',
    component: () => import('@/features/notifications/NotificationsPage.vue'),
    meta: { titleKey: 'pages.notifications', requiresAuth: true },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/features/auth/LoginPage.vue'),
    meta: { titleKey: 'pages.login', guestOnly: true, layout: 'auth' },
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
    component: () => import('@/features/auth/SocialSignupPage.vue'),
    meta: { titleKey: 'pages.socialSignup', guestOnly: true, layout: 'auth' },
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
    component: () => import('@/features/auth/ForgotPasswordPage.vue'),
    meta: { titleKey: 'pages.forgotPassword', guestOnly: true, layout: 'auth' },
  },
  {
    path: '/reset-password/:token',
    name: 'reset-password',
    component: () => import('@/features/auth/ResetPasswordPage.vue'),
    meta: { titleKey: 'pages.resetPassword', allowPartial: true, layout: 'auth' },
  },
  {
    path: '/account/password',
    name: 'account-password',
    component: () => import('@/features/auth/ChangePasswordPage.vue'),
    meta: { titleKey: 'pages.changePassword', requiresAuth: true, layout: 'auth' },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/features/account/profile/ProfileSettingsPage.vue'),
    meta: { titleKey: 'pages.settingsProfile', requiresAuth: true },
  },
  {
    path: '/settings/security',
    name: 'settings-security',
    component: () => import('@/features/account/security/SecuritySettingsPage.vue'),
    meta: { titleKey: 'pages.settingsSecurity', requiresAuth: true },
  },
  {
    path: '/settings/data',
    name: 'settings-data',
    component: () => import('@/features/account/data/DataSettingsPage.vue'),
    meta: { titleKey: 'pages.settingsData', requiresAuth: true },
  },
  {
    path: '/settings/shares',
    name: 'settings-shares',
    component: () => import('@/features/shares/MySharesPage.vue'),
    meta: { titleKey: 'pages.settingsShares', requiresAuth: true },
  },
  {
    path: '/settings/appearance',
    name: 'settings-appearance',
    component: () => import('@/features/appearance/AppearancePage.vue'),
    meta: { titleKey: 'pages.appearance' },
  },
  ...adminRoutes,
  /** Links the backend writes into mails, Discord and feeds (backend CONTRIBUTING, SPA contract); the hash is kept. */
  {
    path: '/post/:id',
    redirect: (to) => ({ name: 'post', params: { id: to.params.id } }),
  },
  {
    path: '/user/:username',
    redirect: (to) => ({ name: 'user', params: { username: to.params.username } }),
  },
  {
    path: '/ticket/:id',
    redirect: (to) => ({ name: 'ticket', params: { id: to.params.id } }),
  },
  {
    path: '/problem/:code',
    redirect: (to) => ({ name: 'problem', params: { code: to.params.code } }),
  },
  {
    path: '/problem/:code/editorial',
    redirect: (to) => ({
      name: 'problem',
      params: { code: to.params.code },
      query: { tab: 'editorial' },
    }),
  },
  {
    path: '/contest/:key/ranking',
    redirect: (to) => ({ name: 'contest-ranking', params: { key: to.params.key } }),
  },
  {
    path: '/public-ranking/:token',
    redirect: (to) => ({ name: 'public-ranking', params: { token: to.params.token } }),
  },
  {
    path: '/contest/:key',
    redirect: (to) => ({ name: 'contest', params: { key: to.params.key } }),
  },
  /** Unknown paths try a stored page first; its 404 renders NotFoundPage. Same path as `not-found`: the earlier record wins for a URL, `not-found` stays reachable by name. */
  {
    path: '/:pathMatch(.*)*',
    name: 'flatpage',
    component: () => import('@/features/flatpages/FlatpagePage.vue'),
    meta: { titleKey: 'pages.flatpage' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/features/not-found/NotFoundPage.vue'),
    meta: { titleKey: 'pages.notFound' },
  },
];
