<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import type { PermissionEntry } from '@/api/types/users-admin';
import { usePermissions } from '@/stores/use-permissions';
import { INPUT } from '../ui/controls';
import { checklistGroups } from './user-access';
import { usePermissionLabel } from './use-permission-label';
import AdminChip from '../ui/AdminChip.vue';

/** Grouped, searchable permissions. The model is the directly granted codenames; `inherited` marks the ones a role grants. Read-only lists only what is held. */
const selected = defineModel<string[]>({ required: true });
const props = defineProps<{
  catalog: readonly PermissionEntry[];
  inherited: ReadonlyMap<string, string[]>;
  readonly?: boolean;
}>();
const permissionLabel = usePermissionLabel();
/** Codenames are developer text: only a superuser sees them, as a tooltip (pages/admin.md, copy rules). */
const { isSuperuser } = usePermissions();
const searchId = useId();
const search = ref('');
const labelOf = (entry: { codename: string; label: string }) =>
  permissionLabel(entry.codename, entry.label);
const groups = computed(() => {
  const held = [...selected.value, ...props.inherited.keys()];
  const all = checklistGroups(props.catalog, held, search.value, labelOf);
  if (!props.readonly) return all;
  return all
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => held.includes(item.codename)),
    }))
    .filter((group) => group.items.length > 0);
});
const toggle = (code: string, on: boolean) => {
  selected.value = on ? [...selected.value, code] : selected.value.filter((item) => item !== code);
};
</script>

<template>
  <div class="flex flex-col gap-3">
    <label :for="searchId" class="sr-only">{{ $t('admin.users.access.search') }}</label>
    <input
      :id="searchId"
      v-model="search"
      type="search"
      :placeholder="$t('admin.users.access.search')"
      :class="INPUT"
    />
    <p v-if="groups.length === 0" class="text-sm text-muted">
      {{ search ? $t('admin.users.access.noMatch') : $t('admin.users.access.noneHeld') }}
    </p>
    <div class="flex flex-col gap-4" data-testid="permission-checklist">
      <fieldset v-for="group in groups" :key="group.category" class="flex flex-col gap-1">
        <legend
          class="mb-1 text-caption leading-4 font-semibold tracking-wide text-muted uppercase"
        >
          {{ $t(`admin.users.access.categories.${group.category}`) }}
        </legend>
        <label
          v-for="item in group.items"
          :key="item.codename"
          class="flex min-h-10 items-center gap-3 rounded-cell px-2 hover:bg-surface-hover touch:min-h-11"
        >
          <input
            v-if="!readonly && (item.category !== 'other' || selected.includes(item.codename))"
            type="checkbox"
            class="size-4 shrink-0 accent-accent"
            :checked="selected.includes(item.codename)"
            @change="toggle(item.codename, ($event.target as HTMLInputElement).checked)"
          />
          <span class="min-w-0 flex-1 text-sm" :title="isSuperuser ? item.codename : undefined">{{
            item.label
          }}</span>
          <span class="flex shrink-0 flex-wrap justify-end gap-1">
            <AdminChip v-if="readonly && selected.includes(item.codename)">
              {{ $t('admin.users.access.direct') }}
            </AdminChip>
            <AdminChip v-for="role in inherited.get(item.codename) ?? []" :key="role" tone="accent">
              {{ $t('admin.users.access.via', { role }) }}
            </AdminChip>
          </span>
        </label>
      </fieldset>
    </div>
  </div>
</template>
