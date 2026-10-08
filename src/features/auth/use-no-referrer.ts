import { onBeforeUnmount } from 'vue';

/**
 * For pages whose address carries a link credential (`/activate/:key`, `/reset-password/:token`,
 * `/register/social?token=`): no request made while they are open sends the address as `Referer`. The policy is set
 * during setup, not on mount, because child components start their requests before the parent mounts. The backend
 * also redacts these paths in its activity log. Requests made before setup (the route chunk, the bootstrap
 * `GET /auth/me`) still use the default policy; they are same-origin and carry no credential.
 */
export function useNoReferrer() {
  const policy = document.createElement('meta');
  policy.name = 'referrer';
  policy.content = 'no-referrer';
  document.head.append(policy);
  onBeforeUnmount(() => policy.remove());
}
