<script setup lang="ts">
import { computed } from 'vue';
import type { OrganizationProblem } from '@/api/types/organization-problems';
import { formatDate } from '@/lib/format-date';
import { COMPACT_LIST_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { useLocaleStore } from '@/stores/locale.store';
import OrgProblemActions from './OrgProblemActions.vue';
import OrgProblemCardList from './OrgProblemCardList.vue';
import OrgProblemName from './OrgProblemName.vue';
import OrgSelectBox from './OrgSelectBox.vue';
import OrgProblemTags from './OrgProblemTags.vue';

/**
 * The rows of board M7A; administrators also get a selection box per row and the two row actions. A row the viewer may
 * edit (`canEdit`, whatever their organization role) gets a pencil to the problem's editor (P-32). Under 640 px the rows
 * are cards (`OrgProblemCardList`), so the name keeps the full width; only one of the two layouts is rendered. The tags and
 * date columns need the table itself to be 48rem wide (the tag catalogue narrows the card on a laptop); below that the
 * tags sit under the name and the date is left out.
 */
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
const isCards = useMediaQuery(COMPACT_LIST_QUERY);
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
</script>

<template>
  <OrgProblemCardList
    v-if="isCards"
    :rows="rows"
    :is-admin="isAdmin"
    :busy-code="busyCode"
    :selected="selected"
    :is-all-selected="isAllSelected"
    @toggle-all="toggleAll"
    @toggle-row="(row) => toggleRow(row.code)"
    @edit-tags="(row) => emit('edit-tags', row)"
    @toggle-archive="(row) => emit('toggle-archive', row)"
  />
  <div v-else class="@container overflow-x-auto">
    <table class="w-full text-left text-sm">
      <caption class="sr-only">
        {{
          $t('orgProblems.tableCaption')
        }}
      </caption>
      <thead class="text-muted">
        <tr>
          <th v-if="isAdmin" scope="col" class="w-11 py-2 pr-3">
            <OrgSelectBox
              :checked="isAllSelected"
              :label="$t('orgProblems.selectAll')"
              @change="toggleAll"
            />
          </th>
          <th scope="col" :class="CELL">{{ $t('orgProblems.columns.code') }}</th>
          <th scope="col" :class="CELL">{{ $t('orgProblems.columns.name') }}</th>
          <th scope="col" class="hidden @3xl:table-cell" :class="CELL">
            {{ $t('orgProblems.columns.tags') }}
          </th>
          <th scope="col" class="hidden text-right whitespace-nowrap @3xl:table-cell" :class="CELL">
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
            <OrgSelectBox
              :checked="selected.includes(row.code)"
              :label="$t('orgProblems.selectRow', { code: row.code })"
              @change="toggleRow(row.code)"
            />
          </td>
          <td :class="CELL" class="font-mono font-semibold">{{ row.code }}</td>
          <td :class="CELL">
            <OrgProblemName :row="row" />
            <OrgProblemTags v-if="row.tags.length" :tags="row.tags" class="mt-1 @3xl:hidden" />
          </td>
          <td class="hidden @3xl:table-cell" :class="CELL">
            <span v-if="row.tags.length === 0" class="text-muted">{{
              $t('orgProblems.noTags')
            }}</span>
            <OrgProblemTags v-else :tags="row.tags" />
          </td>
          <td
            class="hidden text-right whitespace-nowrap tabular-nums @3xl:table-cell"
            :class="CELL"
          >
            {{ formatDate(row.updatedAt, 'date', locale.locale) }}
          </td>
          <td v-if="isAdmin" class="py-2">
            <div class="flex justify-end gap-2">
              <OrgProblemActions
                :row="row"
                :is-busy="busyCode === row.code"
                @edit-tags="emit('edit-tags', row)"
                @toggle-archive="emit('toggle-archive', row)"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
