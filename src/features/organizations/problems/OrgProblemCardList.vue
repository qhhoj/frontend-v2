<script setup lang="ts">
import type { OrganizationProblem } from '@/api/types/organization-problems';
import OrgProblemActions from './OrgProblemActions.vue';
import OrgProblemName from './OrgProblemName.vue';
import OrgSelectBox from './OrgSelectBox.vue';
import OrgProblemTags from './OrgProblemTags.vue';

/**
 * The phone layout of `OrgProblemTable` (under 640 px): one card per problem, the name on the full width, then its code
 * and tags, then the administrator's two actions side by side. The tick boxes keep the table's names.
 */
defineProps<{
  rows: OrganizationProblem[];
  isAdmin: boolean;
  busyCode: string | null;
  selected: string[];
  isAllSelected: boolean;
}>();
const emit = defineEmits<{
  'toggle-all': [];
  'toggle-row': [row: OrganizationProblem];
  'edit-tags': [row: OrganizationProblem];
  'toggle-archive': [row: OrganizationProblem];
}>();
</script>

<template>
  <div class="flex flex-col">
    <div v-if="isAdmin" class="flex items-center gap-1 text-sm text-muted">
      <OrgSelectBox
        :checked="isAllSelected"
        :label="$t('orgProblems.selectAll')"
        @change="emit('toggle-all')"
      />
      {{ $t('orgProblems.selectAll') }}
    </div>
    <ul class="m-0 flex list-none flex-col p-0" :aria-label="$t('orgProblems.tableCaption')">
      <li
        v-for="row in rows"
        :key="row.code"
        class="flex items-start gap-1 border-t border-line py-3"
      >
        <OrgSelectBox
          v-if="isAdmin"
          :checked="selected.includes(row.code)"
          :label="$t('orgProblems.selectRow', { code: row.code })"
          @change="emit('toggle-row', row)"
        />
        <div class="flex min-w-0 flex-1 flex-col gap-2 [overflow-wrap:anywhere]">
          <p class="m-0 text-sm">
            <OrgProblemName :row="row" />
          </p>
          <p class="m-0 font-mono text-meta text-muted">{{ row.code }}</p>
          <OrgProblemTags v-if="row.tags.length" :tags="row.tags" />
          <div v-if="isAdmin" class="flex flex-wrap gap-2">
            <OrgProblemActions
              :row="row"
              :is-busy="busyCode === row.code"
              @edit-tags="emit('edit-tags', row)"
              @toggle-archive="emit('toggle-archive', row)"
            />
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
