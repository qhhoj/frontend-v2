import { onBeforeUnmount, onMounted } from 'vue';

/**
 * For pages whose address carries a link credential (`/activate/:key`, `/reset-password/:token`): no request made
 * while they are open sends the address as `Referer`. The backend also redacts these paths in its activity log.
 */
export function useNoReferrer() {
  const policy = document.createElement('meta');
  policy.name = 'referrer';
  policy.content = 'no-referrer';
  onMounted(() => document.head.append(policy));
  onBeforeUnmount(() => policy.remove());
}
