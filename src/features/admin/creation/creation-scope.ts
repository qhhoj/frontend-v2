import { computed } from 'vue';
import type { CreatableKind } from '@/api/organizations-admin.api';
import type { Schemas } from '@/api/schemas';
import { useSessionStore } from '@/stores/session.store';

/** What a create form makes: the `canCreate` values of `GET /organizations` (`problem`, `contest`). */
export type CreationKind = CreatableKind;
export type CreationScope = Schemas['CreationScopeResponse'];

const NONE: CreationScope = { site: false, organizations: false };
const FIELD = { problem: 'problemCreation', contest: 'contestCreation' } as const;

/**
 * Where the signed-in viewer may create a problem or a contest, as the backend reports it (`adminCapabilities`); the SPA
 * derives no rule of its own. `canCreate`: a create button is shown at all.
 */
export function useCreationScope(kind: CreationKind) {
  const session = useSessionStore();
  const scope = computed<CreationScope>(
    () => session.user?.adminCapabilities?.[FIELD[kind]] ?? NONE,
  );
  const canCreate = computed(() => scope.value.site || scope.value.organizations);
  return { scope, canCreate };
}
