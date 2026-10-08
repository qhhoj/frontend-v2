import { onBeforeUnmount, onMounted } from 'vue';

/**
 * For pages whose address carries a link credential (`/activate/:key`, `/reset-password/:token`): no request made
 * while they are open sends the address as `Referer`. The backend also redacts these paths in its activity log.
 * Requests made before the page mounts (the route chunk, the bootstrap `GET /auth/me`) still use the default policy;
 * they are same-origin, so only the browser's default `Referer` for them applies.
 */
export function useNoReferrer() {
  const policy = document.createElement('meta');
  policy.name = 'referrer';
  policy.content = 'no-referrer';
  onMounted(() => document.head.append(policy));
  onBeforeUnmount(() => policy.remove());
}
