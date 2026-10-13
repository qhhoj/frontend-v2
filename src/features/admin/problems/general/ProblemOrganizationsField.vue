<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import { Lock, X } from 'lucide-vue-next';
import Notice from '@/components/ui/Notice.vue';
import { translate } from '@/i18n';
import { usePermissions } from '@/stores/use-permissions';
import { useCreationOwnersQuery } from '../../creation/creation-owners';
import type { CreationOwner } from '../../creation/creation-owners';
import { useCreationScope } from '../../creation/creation-scope';
import { INPUT } from '../../ui/controls';
import { needsPermissionText } from '../../ui/permission-text';
import { shortId } from '../../ui/short-id';
import { useOrganizationNames } from '../../ui/use-organization-names';
import type { ProblemForm } from './problem-form';

/**
 * Moving a problem between organizations, for an editor without `judge.edit_all_problem` (backend
 * `OrganizationProblemRules`): they add and remove only organizations they may create problems for (the creation owners),
 * and leave every organization for the site only with `judge.add_problem`. Joining the first organization makes the problem
 * private to it, leaving the last one makes it a site problem. The code is never renamed: a notice names the prefix.
 */
const form = defineModel<ProblemForm>({ required: true });
defineProps<{ error?: string }>();
const id = useId();
const { can } = usePermissions();
const { scope } = useCreationScope('problem');
const owners = useCreationOwnersQuery(() => scope.value.organizations);
const managed = computed(() => (scope.value.organizations ? (owners.data.value ?? []) : []));
const ownerOf = (organizationId: string): CreationOwner | undefined =>
  managed.value.find((owner) => owner.id === organizationId);
const names = useOrganizationNames(() =>
  form.value.organizations.some((chip) => !ownerOf(chip.id)),
);
const nameOf = (organizationId: string) =>
  ownerOf(organizationId)?.name ?? names.value.get(organizationId) ?? shortId(organizationId);

const ids = computed(() => form.value.organizations.map((chip) => chip.id));
const addable = computed(() => managed.value.filter((owner) => !ids.value.includes(owner.id)));
const canLeaveForSite = computed(() => can('judge.add_problem'));
const isLastOwned = computed(() => ids.value.length === 1 && form.value.isOrganizationPrivate);

/** Why this chip has no remove button; null when it can be removed. */
function lockReason(organizationId: string): string | null {
  if (!ownerOf(organizationId))
    return translate('admin.problems.people.orgNotManaged', { name: nameOf(organizationId) });
  if (isLastOwned.value && !canLeaveForSite.value) return needsPermissionText('judge.add_problem');
  return null;
}

function setOrganizations(next: string[]) {
  const wasEmpty = ids.value.length === 0;
  // Chips carry only ids here, like the stored form, so re-adding an organization is no change.
  form.value.organizations = next.map((organizationId) => ({ id: organizationId, slug: null }));
  if (next.length === 0) form.value.isOrganizationPrivate = false;
  else if (wasEmpty) form.value.isOrganizationPrivate = true;
}
const remove = (organizationId: string) =>
  setOrganizations(ids.value.filter((other) => other !== organizationId));
const picked = ref('');
function add() {
  if (picked.value) setOrganizations([...ids.value, picked.value]);
  picked.value = '';
}

/** The prefix the code must carry after the save: the first organization's, when the problem stays organization-private. */
const neededPrefix = computed(() => {
  const first = ids.value[0];
  if (!first || !form.value.isOrganizationPrivate) return null;
  const prefix = ownerOf(first)?.problemCodePrefix;
  return prefix && !form.value.code.startsWith(prefix) ? prefix : null;
});
</script>

<template>
  <div class="flex flex-col gap-1.5 lg:col-span-2" data-testid="people-organizations">
    <component
      :is="addable.length > 0 ? 'label' : 'span'"
      :for="addable.length > 0 ? id : undefined"
      class="text-sm font-semibold"
      >{{ $t('admin.problems.people.organizations') }}</component
    >
    <ul class="flex flex-wrap gap-2">
      <li
        v-for="organizationId in ids"
        :key="organizationId"
        data-testid="organization-chip"
        class="inline-flex min-h-11 items-center gap-1 rounded-pill border border-line py-0.5 pl-3 text-sm"
        :class="lockReason(organizationId) && 'pr-3'"
      >
        <span>{{ nameOf(organizationId) }}</span>
        <button
          v-if="!lockReason(organizationId)"
          type="button"
          class="inline-flex size-11 items-center justify-center rounded-full hover:bg-surface-hover"
          :aria-label="$t('admin.ui.removeChip', { name: nameOf(organizationId) })"
          @click="remove(organizationId)"
        >
          <X aria-hidden="true" class="size-4" />
        </button>
        <span
          v-else
          class="inline-flex items-center text-muted"
          :title="lockReason(organizationId)!"
        >
          <Lock aria-hidden="true" class="size-3.5" />
          <span class="sr-only">{{ lockReason(organizationId) }}</span>
        </span>
      </li>
      <li v-if="ids.length === 0" class="text-sm text-muted">
        {{ $t('admin.problems.people.orgSite') }}
      </li>
    </ul>
    <select
      v-if="addable.length > 0"
      :id="id"
      v-model="picked"
      :class="INPUT"
      class="sm:max-w-sm"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="`${id}-hint${error ? ` ${id}-error` : ''}`"
      @change="add"
    >
      <option value="">{{ $t('admin.problems.people.orgAdd') }}</option>
      <option v-for="owner in addable" :key="owner.id" :value="owner.id">{{ owner.name }}</option>
    </select>
    <p v-if="error" :id="`${id}-error`" class="text-sm text-negative">{{ error }}</p>
    <p v-else :id="`${id}-hint`" class="text-xs text-muted">
      {{ $t('admin.problems.people.orgMoveHint') }}
    </p>
    <Notice v-if="neededPrefix" tone="warning" compact data-testid="organization-prefix-notice">
      {{ $t('admin.problems.people.orgPrefix', { prefix: neededPrefix }) }}
    </Notice>
  </div>
</template>
