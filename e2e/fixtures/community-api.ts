import { ratingHistory, userPage } from '../../src/test/fixtures';
import {
  activity,
  commentThreadPage,
  flatpage,
  member,
  organizationDetail,
  organizationItem,
  postDetail,
  postItem,
  ppEntry,
  solved,
  ticketDetail,
  ticketItem,
} from '../../src/test/community-fixtures';
import { list, ok } from './reply';
import type { Handler } from './reply';

const NOT_FOUND = { status: 404, body: { error: { code: 'not_found', message: 'Not found' } } };
const eventStream = { contentType: 'text/event-stream', raw: 'retry: 600000\n\n' };

const userAndContentRoutes = (): Record<string, Handler> => ({
  'GET /contributors': list([]),
  'GET /users/:username/rank': ok({ rank: 1134, page: 12, pageSize: 100 }),
  'GET /users/:username': ({ params }) => ok(userPage({ username: params.username })),
  'GET /users/:username/ratings': ok(ratingHistory()),
  'GET /users/:username/activity': ok(activity()),
  'GET /users/:username/solved': ok(solved()),
  'GET /users/:username/pp-breakdown': {
    body: { data: [ppEntry(1), ppEntry(2)], meta: { page: 1, pageSize: 10, hasMore: false } },
  },
  'GET /users/:username/blog': list([postItem()]),
  'GET /users/:username/comments': { body: { data: [], meta: { pageSize: 10, nextBefore: null } } },
  'GET /posts': list([
    postItem(),
    postItem({ id: 'post-2', title: 'Mẹo tối ưu đọc ghi nhanh', sticky: true }),
  ]),
  'GET /posts/:id': ({ params }) => ok(postDetail({ id: params.id })),
  'PUT /posts/:id/vote': ok({ score: 59, viewerVote: 1 }),
  'GET /comments/pages/:type/:key': ({ params }) =>
    ok(commentThreadPage({ page: { type: 'blog', key: params.key, title: 'Bài viết' } })),
});

const organizationTicketRoutes = (): Record<string, Handler> => ({
  'GET /organizations': list([
    organizationItem(),
    organizationItem({
      id: 'org-2',
      slug: 'hcmus',
      shortName: 'HCMUS',
      name: 'Đội tuyển HCMUS',
      isOpen: false,
    }),
  ]),
  'GET /organizations/:slug': ({ params }) => ok(organizationDetail({ slug: params.slug })),
  'GET /organizations/:slug/members': list([member(1, 'tuanlq'), member(2, 'khoa.tran')]),
  'GET /organizations/:slug/posts': list([]),
  'GET /tickets': list([ticketItem()]),
  'GET /tickets/:id': ({ params }) => ok(ticketDetail({ id: params.id })),
  'GET /events/tickets': eventStream,
  'GET /events/tickets/:id': eventStream,
  'GET /pages/about/rules': ok(flatpage()),
  'GET /pages/*': NOT_FOUND,
});

/** Default answers for every 8e endpoint; specs replace single keys (`api.routes['GET /posts'] = …`). Exact keys win over patterns. */
export const communityRoutes = (): Record<string, Handler> => ({
  ...userAndContentRoutes(),
  ...organizationTicketRoutes(),
});
