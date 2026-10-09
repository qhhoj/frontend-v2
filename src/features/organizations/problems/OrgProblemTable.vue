<script setup lang="ts">
import { computed } from 'vue';
import type { OrganizationProblem } from '@/api/types/organization-problems';
import { formatDate } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import OrgTagChip from './OrgTagChip.vue';

/** The rows of board M7A; administrators also get a selection box per row and the two row actions. */
const props = defineProps<{
  rows: OrganizationProblem[];
  isAdmin: boolean;
  busyCode: string | null;
}>();
const selected = defineModel<string[]>('selected', { required: true });
const emit = defineEmits<{
  'edit-tags': [row: OrganizationProblem];
  'toggle-archive': [row: OrganizationProblem];
}>();
const locale = useLocaleStore();
const codes = computed(() => props.rows.map((row) => row.code));
const isAllSelected = computed(
  () => codes.value.length > 0 && codes.value.every((code) => selected.value.includes(code)),
);
function toggleAll() {
  selected.value = isAllSelected.value
    ? selected.value.filter((code) => !codes.value.includes(code))
    : [...new Set([...selected.value, ...codes.value])];
}
function toggleRow(code: string) {
  selected.value = selected.value.includes(code)
    ? selected.value.filter((kept) => kept !== code)
    : [...selected.value, code];
}
const CELL = 'py-2 pr-3 align-middle';
const ACTION =
  'inline-flex min-h-11 items-center rounded-pill border border-line px-3 text-sm font-semibold hover:bg-surface-hover aria-disabled:cursor-progress aria-disabled:text-muted';
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm">
      <caption class="sr-only">
        {{
          $t('orgProblems.tableCaption')
        }}
      </caption>
      <thead class="text-muted">
        <tr>
          <th v-if="isAdmin" scope="col" class="w-11 py-2 pr-3">
            <label class="inline-flex size-11 items-center justify-center">
              <input
                type="checkbox"
                class="size-5"
                :checked="isAllSelected"
                :aria-label="$t('orgProblems.selectAll')"
                @change="toggleAll"
              />
            </label>
          </th>
          <th scope="col" :class="CELL">{{ $t('orgProblems.columns.code') }}</th>
          <th scope="col" :class="CELL">{{ $t('orgProblems.columns.name') }}</th>
          <th scope="col" class="hidden md:table-cell" :class="CELL">
            {{ $t('orgProblems.columns.tags') }}
          </th>
          <th scope="col" class="hidden text-right md:table-cell" :class="CELL">
            {{ $t('orgProblems.columns.updated') }}
          </th>
          <th v-if="isAdmin" scope="col" class="py-2 text-right">
            <span class="sr-only">{{ $t('orgProblems.columns.actions') }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.code" class="border-t border-line">
          <td v-if="isAdmin" class="py-2 pr-3">
            <label class="inline-flex size-11 items-center justify-center">
              <input
                type="checkbox"
                class="size-5"
                :checked="selected.includes(row.code)"
                :aria-label="$t('orgProblems.selectRow', { code: row.code })"
                @change="toggleRow(row.code)"
              />
            </label>
          </td>
          <td :class="CELL" class="font-mono font-semibold">{{ row.code }}</td>
          <td :class="CELL">
            <RouterLink
              :to="{ name: 'problem', params: { code: row.code } }"
              class="font-semibold text-content hover:underline"
              >{{ row.name }}</RouterLink
            >
            <span
              v-if="row.isArchived"
              class="ml-2 rounded-pill bg-surface-hover px-2 py-0.5 text-xs font-semibold text-content"
              >{{ $t('orgProblems.archivedChip') }}</span
            >
          </td>
          <td class="hidden md:table-cell" :class="CELL">
            <span v-if="row.tags.length === 0" class="text-muted">{{
              $t('orgProblems.noTags')
            }}</span>
            <span v-else class="flex flex-wrap gap-1.5">
              <OrgTagChip v-for="tag in row.tags" :key="tag.id" :tag="tag" />
            </span>
          </td>
          <td class="hidden text-right tabular-nums md:table-cell" :class="CELL">
            {{ formatDate(row.updatedAt, locale.locale) }}
          </td>
          <td v-if="isAdmin" class="py-2">
            <div class="flex flex-col items-end gap-2 md:flex-row md:justify-end">
              <button
                type="button"
                :class="ACTION"
                :aria-label="$t('orgProblems.editTagsLabel', { code: row.code })"
                @click="emit('edit-tags', row)"
              >
                {{ $t('orgProblems.editTags') }}
              </button>
              <button
                type="button"
                :class="ACTION"
                :aria-disabled="busyCode === row.code ? 'true' : undefined"
                :aria-label="
                  $t(
                    row.isArchived
                      ? 'orgProblems.unarchiveRowLabel'
                      : 'orgProblems.archiveRowLabel',
                    {
                      code: row.code,
                    },
                  )
                "
                @click="emit('toggle-archive', row)"
              >
                {{ $t(row.isArchived ? 'orgProblems.unarchiveRow' : 'orgProblems.archiveRow') }}
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
