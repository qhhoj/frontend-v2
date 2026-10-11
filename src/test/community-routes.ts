import { ratingHistory, userPage } from './fixtures';
import {
  activity,
  commentThreadPage,
  homeResponse,
  organizationDetail,
  organizationItem,
  postDetail,
  postItem,
  ppEntry,
  solved,
} from './community-fixtures';
import { ok, page } from './mock-api';
import type { MockHandler } from './mock-api';
import type { PostDetail } from '../api/types/blog';
import type { CommentPageType, CommentThreadPage } from '../api/types/comments';
import type { OrganizationDetail } from '../api/types/organizations';
import type { UserPage } from '../api/types/users';

type Routes = Record<string, MockHandler>;

/** Everything the profile layout and its overview ask for one user. */
export const profileRoutes = (user: UserPage = userPage()): Routes => ({
  [`GET /users/${user.username}`]: ok(user),
  [`GET /users/${user.username}/ratings`]: ok(ratingHistory()),
  [`GET /users/${user.username}/activity`]: ok(activity()),
});
/** The profile tabs of one user. */
export const profileTabRoutes = (username = 'user_01'): Routes => ({
  [`GET /users/${username}/solved`]: ok(solved()),
  [`GET /users/${username}/pp-breakdown`]: page([ppEntry(1), ppEntry(2)], {
    pageSize: 10,
    hasMore: false,
    total: undefined,
  }),
  [`GET /users/${username}/blog`]: page([postItem()], { pageSize: 10 }),
  [`GET /users/${username}/comments`]: page([], { pageSize: 10, nextBefore: null }),
});
/** `/home` for the community screens: recent comments, new problems and the top users. */
export const communityHomeRoutes: Routes = { 'GET /home': ok(homeResponse()) };
/** Answers for any screen that renders the blog list (`/blog`): its empty newsfeed, the rail's home data and (signed in) no drafts. */
export const blogListRoutes: Routes = {
  ...communityHomeRoutes,
  'GET /posts': page([]),
  'GET /posts/drafts': page([]),
};
/** The organization layout and its about tab. */
export const organizationRoutes = (detail: OrganizationDetail = organizationDetail()): Routes => ({
  'GET /organizations': page([organizationItem()], { pageSize: 100 }),
  [`GET /organizations/${detail.slug}`]: ok(detail),
  [`GET /organizations/${detail.slug}/members`]: page([], { pageSize: 5 }),
  [`GET /organizations/${detail.slug}/posts`]: page([], { pageSize: 10 }),
});
export const organizationListRoutes: Routes = {
  'GET /organizations': page([organizationItem()], { pageSize: 100 }),
};
/** One post and its comment thread. */
export const postRoutes = (detail: PostDetail = postDetail()): Routes => ({
  [`GET /posts/${detail.id}`]: ok(detail),
  [`GET /comments/pages/blog/${detail.id}`]: ok(
    commentThreadPage({ page: { type: 'blog', key: detail.id, title: detail.title } }),
  ),
  [`GET /users/${detail.authors[0]!.username}`]: ok(
    userPage({ username: detail.authors[0]!.username, rating: 2450 }),
  ),
  [`GET /users/${detail.authors[0]!.username}/blog`]: page([detail], { pageSize: 10 }),
});

/** `GET /comments/pages/<type>/<key>`: an open page with no comments unless `overrides` says otherwise. */
export const commentPageRoute = (
  type: CommentPageType,
  key: string,
  overrides: Partial<CommentThreadPage> = {},
): Routes => ({
  [`GET /comments/pages/${type}/${encodeURIComponent(key)}`]: ok(
    commentThreadPage({
      page: { type, key, title: key },
      comments: [],
      pagination: { page: 1, pageSize: 20, total: 0 },
      ...overrides,
    }),
  ),
});
/** The post editor (`/blog/new`) of a viewer who may write a personal post and no organization post. */
export const postEditorRoutes: Routes = {
  'GET /posts/compose-options': ok({
    canWritePersonal: true,
    minSolvedProblems: 10,
    organizations: [],
  }),
};
