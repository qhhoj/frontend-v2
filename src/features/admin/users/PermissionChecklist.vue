<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import type { PermissionEntry } from '@/api/types/users-admin';
import { ADMIN_INPUT_CLASS } from '../ui/classes';
import { checklistGroups } from './user-access';
import { usePermissionLabel } from './use-permission-label';

/** Grouped, searchable permissions. The model is the directly granted codenames; `inherited` marks the ones a role grants. Read-only lists only what is held. */
const selected = defineModel<string[]>({ required: true });
const props = defineProps<{
  catalog: readonly PermissionEntry[];
  inherited: ReadonlyMap<string, string[]>;
  readonly?: boolean;
}>();
const permissionLabel = usePermissionLabel();
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
      :class="ADMIN_INPUT_CLASS"
    />
    <p v-if="groups.length === 0" class="text-sm text-muted">
      {{ search ? $t('admin.users.access.noMatch') : $t('admin.users.access.noneHeld') }}
    </p>
    <div
      class="flex max-h-96 flex-col gap-4 overflow-y-auto pr-1"
      data-testid="permission-checklist"
    >
      <fieldset v-for="group in groups" :key="group.category" class="flex flex-col gap-1">
        <legend class="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">
          {{ $t(`admin.users.access.categories.${group.category}`) }}
        </legend>
        <label
          v-for="item in group.items"
          :key="item.codename"
          class="flex min-h-11 items-center gap-3 rounded-row px-2 hover:bg-surface-solid"
        >
          <input
            v-if="!readonly && (item.category !== 'other' || selected.includes(item.codename))"
            type="checkbox"
            class="size-5 shrink-0 accent-accent"
            :checked="selected.includes(item.codename)"
            @change="toggle(item.codename, ($event.target as HTMLInputElement).checked)"
          />
          <span class="flex min-w-0 flex-1 flex-col">
            <span class="text-sm">{{ item.label }}</span>
            <span class="truncate font-mono text-xs text-muted">{{ item.codename }}</span>
          </span>
          <span class="flex shrink-0 flex-wrap justify-end gap-1">
            <span
              v-if="readonly && selected.includes(item.codename)"
              class="rounded-pill border border-line-strong px-2 text-xs"
            >
              {{ $t('admin.users.access.direct') }}
            </span>
            <span
              v-for="role in inherited.get(item.codename) ?? []"
              :key="role"
              class="rounded-pill bg-accent-soft px-2 text-xs text-accent-soft-text"
            >
              {{ $t('admin.users.access.via', { role }) }}
            </span>
          </span>
        </label>
      </fieldset>
    </div>
  </div>
</template>
