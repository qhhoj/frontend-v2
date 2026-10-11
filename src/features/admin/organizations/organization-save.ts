import { useQueryClient } from '@tanstack/vue-query';
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
 * The write of the editor. A saved organization becomes the new baseline and is handed to `onSaved` (the page moves to a
 * new slug) BEFORE every `['organizations', …]` query is refreshed: refreshing first would refetch the old slug, whose 404
 * replaces the page (and the editor) before it could move.
 */
export function useOrganizationSave(
  seed: (next: OrganizationForm) => void,
  onSaved: (saved: OrganizationDetail) => unknown,
) {
  const queryClient = useQueryClient();
  return useOrganizationWrite<SaveRequest, OrganizationDetail>({
    mutate: sendSave,
    onDone: async (saved) => {
      seed(toOrganizationForm(saved));
      await onSaved(saved);
      await queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}
