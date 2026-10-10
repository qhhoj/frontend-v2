import type { RouteLocationRaw } from 'vue-router';
import type { CommentPageLink } from '@/api/types/comments';

/** The screen a comment page lives on; null for a tag problem, which has no screen. */
export function commentPageRoute(link: CommentPageLink): RouteLocationRaw | null {
  switch (link.type) {
    case 'blog':
      return { name: 'post', params: { id: link.key } };
    case 'problem':
      return { name: 'problem', params: { code: link.key } };
    case 'editorial':
      return { name: 'problem', params: { code: link.key }, query: { tab: 'editorial' } };
    case 'contest':
      return { name: 'contest', params: { key: link.key } };
    default:
      return null;
  }
}

/** One comment on its screen: the page's route with the `#comment-<id>` anchor (which also opens the right listing page). */
export function commentRoute(link: CommentPageLink, commentId: string): RouteLocationRaw | null {
  const route = commentPageRoute(link);
  return route && typeof route === 'object' ? { ...route, hash: `#comment-${commentId}` } : null;
}
