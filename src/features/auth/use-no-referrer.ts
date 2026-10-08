import { onBeforeUnmount } from 'vue';

/** The browser default, in force when no referrer meta exists. */
const DEFAULT_POLICY = 'strict-origin-when-cross-origin';

/**
 * For pages whose address carries a link credential (`/activate/:key`, `/reset-password/:token`,
 * `/register/social?token=`): no request made while they are open sends the address as `Referer`. The policy is set
 * during setup, not on mount, because child components start their requests before the parent mounts. The backend
 * also redacts these paths in its activity log. The policy in force before is restored when the page unmounts. Requests made before setup (the route chunk, the bootstrap
 * `GET /auth/me`) still use the default policy; they are same-origin and carry no credential.
 */
export function useNoReferrer() {
  const existing = document.head.querySelector<HTMLMetaElement>('meta[name="referrer"]');
  const policy = existing ?? document.createElement('meta');
  const previous = existing?.content ?? DEFAULT_POLICY;
  policy.name = 'referrer';
  policy.content = 'no-referrer';
  if (!existing) document.head.append(policy);
  onBeforeUnmount(() => {
    // Removing a referrer meta does not reset the document's policy, so the previous one is written back first.
    policy.content = previous;
    if (!existing) policy.remove();
  });
}
