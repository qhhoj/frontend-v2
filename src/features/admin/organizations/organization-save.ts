import { useRoute, useRouter } from 'vue-router';
import { createOrganization, updateOrganization } from '@/api/organizations-admin.api';
import type { OrganizationBody } from '@/api/organizations-admin.api';
import type { OrganizationDetail } from '@/api/types/organizations';
import { toOrganizationForm } from './organization-form';
import type { OrganizationForm } from './organization-form';
import { useOrganizationWrite } from './organization-write';

/** One write the editor sends: a create with its whole body, or an edit with the fields that changed. */
export type SaveRequest =
  | { kind: 'create'; body: OrganizationBody }
  | { kind: 'edit'; slug: string; patch: Partial<OrganizationBody> };

const sendSave = (request: SaveRequest): Promise<OrganizationDetail> =>
  request.kind === 'create'
    ? createOrganization(request.body)
    : updateOrganization(request.slug, request.patch);

/**
 * The write of the editor. A saved organization becomes the new baseline, and a changed slug moves `?org=` to it. Writes
 * refresh every `['organizations', …]` query, the public list and detail included.
 */
export function useOrganizationSave(seed: (next: OrganizationForm) => void) {
  const router = useRouter();
  const route = useRoute();
  return useOrganizationWrite<SaveRequest, OrganizationDetail>({
    mutate: sendSave,
    invalidates: () => [['organizations']],
    onDone: (saved) => {
      seed(toOrganizationForm(saved));
      if (saved.slug !== route.query.org) {
        void router.push({ query: { ...route.query, org: saved.slug } });
      }
    },
  });
}
