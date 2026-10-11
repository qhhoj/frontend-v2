<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminChip from '../ui/AdminChip.vue';
import AdminDataTable from '../ui/table/AdminDataTable.vue';
import type { AdminColumn } from '../ui/table/table-columns';
import { hasVersionDrift } from './languages';
import type { LanguageRow } from './languages';

/**
 * The languages list. With the judges loaded (`judgeTotal` not null) it adds the coverage column: "5 / 5" judges, a meter that
 * repeats that text, the online count, and the judges behind it. Below 768 px each language is a card.
 */
const props = defineProps<{ rows: LanguageRow[]; judgeTotal: number | null; canEdit: boolean }>();
const { t } = useI18n();

const columns = computed<AdminColumn[]>(() => [
  { key: 'key', label: t('admin.languages.table.key'), priority: 'primary' },
  { key: 'inProblem', label: t('admin.languages.table.inProblem'), priority: 'badge' },
  { key: 'name', label: t('admin.languages.table.name') },
  { key: 'extension', label: t('admin.languages.table.extension') },
  ...(props.judgeTotal === null
    ? []
    : ([
        { key: 'coverage', label: t('admin.languages.table.coverage') },
        { key: 'versions', label: t('admin.languages.table.versions'), priority: 'meta' },
      ] satisfies AdminColumn[])),
]);
const percentOf = (count: number) =>
  props.judgeTotal ? Math.round((count / props.judgeTotal) * 100) : 0;
</script>

<template>
  <AdminDataTable
    :columns="columns"
    :rows="rows"
    :row-key="(row) => row.key"
    :row-label="(row) => row.name"
    :label="$t('admin.languages.table.caption')"
  >
    <template #cell-key="{ row }">
      <RouterLink
        v-if="canEdit"
        :to="{ name: 'admin-languageEdit', params: { key: row.key } }"
        class="font-mono font-semibold text-accent-text underline-offset-2 hover:underline"
        >{{ row.key }}</RouterLink
      >
      <span v-else class="font-mono font-semibold">{{ row.key }}</span>
    </template>
    <template #cell-inProblem="{ row }">
      <AdminChip v-if="row.includeInProblem" tone="accent">
        {{ $t('admin.languages.table.inProblemChip') }}
      </AdminChip>
      <span v-else class="text-muted">—</span>
    </template>
    <template #cell-name="{ row }">
      <span class="inline-flex flex-wrap items-center gap-1.5">
        {{ row.name }}
        <AdminChip v-if="row.fileOnly">{{ $t('admin.languages.table.fileOnly') }}</AdminChip>
      </span>
    </template>
    <template #cell-extension="{ row }">
      <span class="font-mono">.{{ row.extension }}</span>
    </template>
    <template #cell-coverage="{ row }">
      <span class="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
        <span class="font-mono whitespace-nowrap tabular-nums">{{
          $t('admin.languages.table.judgesCount', {
            count: row.judges?.length ?? 0,
            total: judgeTotal,
          })
        }}</span>
        <span aria-hidden="true" class="h-1.5 w-16 rounded-pill bg-surface-strong">
          <span
            class="block h-full rounded-pill bg-accent"
            :style="{ width: `${percentOf(row.judges?.length ?? 0)}%` }"
          />
        </span>
        <span
          class="whitespace-nowrap"
          :class="row.onlineJudges?.length ? 'text-muted' : 'font-semibold text-negative'"
        >
          {{ $t('admin.languages.table.onlineCount', { count: row.onlineJudges?.length ?? 0 }) }}
        </span>
        <AdminChip v-if="hasVersionDrift(row)" tone="caution">
          {{ $t('admin.languages.table.versionDrift') }}
        </AdminChip>
      </span>
    </template>
    <template #cell-versions="{ row }">
      <details v-if="row.versions?.length" class="py-1.5">
        <summary class="w-fit cursor-pointer text-accent-text">
          {{ $t('admin.languages.table.showJudges') }}
        </summary>
        <ul class="mt-1 font-mono text-xs">
          <li v-for="version in row.versions" :key="version.judge">
            <RouterLink :to="{ name: 'admin-judges' }" class="hover:underline">{{
              version.judge
            }}</RouterLink>
            <span class="text-muted"> · {{ version.runtime }}</span>
          </li>
        </ul>
      </details>
      <span v-else class="text-muted">—</span>
    </template>
    <template #empty><slot name="empty" /></template>
    <template #footer>
      <slot name="footer" />
    </template>
  </AdminDataTable>
</template>
