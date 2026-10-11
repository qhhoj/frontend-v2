<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { SubmissionListItem } from '@/api/types/submissions';
import UserName from '@/components/UserName.vue';
import VerdictBadge from '@/components/VerdictBadge.vue';
import { formatCaseMemory, formatCaseTime, formatNumericDateTime } from '@/lib/format';
import { verdictOf } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import { shortId } from '../ui/short-id';
import AdminDataTable from '../ui/table/AdminDataTable.vue';
import type { AdminColumn } from '../ui/table/table-columns';

/**
 * Staff columns of the old changelist (time, memory, points, language); cards below 768 px. With `selectable`, the checkbox
 * column drives `selected` and the `bulk` slot replaces the toolbar while rows are picked.
 */
defineProps<{ items: SubmissionListItem[]; label: string; selectable?: boolean }>();
const selected = defineModel<Set<string>>('selected', { default: () => new Set<string>() });
defineSlots<{ bulk?: () => unknown; footer?: () => unknown; empty?: () => unknown }>();
const { t } = useI18n();
const locale = useLocaleStore();

const columns = computed<AdminColumn[]>(() => [
  { key: 'id', label: t('admin.submissions.table.id'), priority: 'primary' },
  { key: 'verdict', label: t('admin.submissions.table.verdict'), priority: 'badge' },
  { key: 'user', label: t('admin.submissions.table.user') },
  { key: 'problem', label: t('admin.submissions.table.problem') },
  { key: 'points', label: t('admin.submissions.table.points'), align: 'end' },
  { key: 'time', label: t('admin.submissions.table.time'), align: 'end', priority: 'meta' },
  { key: 'memory', label: t('admin.submissions.table.memory'), align: 'end', priority: 'meta' },
  { key: 'language', label: t('admin.submissions.table.language'), priority: 'meta' },
  { key: 'date', label: t('admin.submissions.table.date'), priority: 'meta' },
]);
const pointsText = (item: SubmissionListItem) =>
  item.points === null || !item.problem ? '—' : `${item.points} / ${item.problem.points}`;
</script>

<template>
  <AdminDataTable
    v-model:selected="selected"
    :columns="columns"
    :rows="items"
    :row-key="(item) => item.id"
    :row-label="(item) => shortId(item.id)"
    :label="label"
    :selectable="selectable"
  >
    <template #bulk><slot name="bulk" /></template>
    <template #cell-id="{ row }">
      <RouterLink
        :to="{ name: 'submission', params: { id: row.id } }"
        class="font-mono font-semibold text-accent-text hover:underline"
        >{{ shortId(row.id) }}</RouterLink
      >
    </template>
    <template #cell-verdict="{ row }"
      ><VerdictBadge :verdict="verdictOf(row)" size="sm"
    /></template>
    <template #cell-user="{ row }">
      <UserName v-if="row.user" :username="row.user.username" />
      <span v-else class="text-muted">—</span>
    </template>
    <template #cell-problem="{ row }">
      <span class="font-mono">{{ row.problem?.code ?? '—' }}</span>
    </template>
    <template #cell-points="{ row }">{{ pointsText(row) }}</template>
    <template #cell-time="{ row }">{{
      row.time === null ? '—' : formatCaseTime(row.time)
    }}</template>
    <template #cell-memory="{ row }">
      {{ row.memory === null ? '—' : formatCaseMemory(row.memory) }}
    </template>
    <template #cell-language="{ row }">{{ row.language?.name ?? '—' }}</template>
    <template #cell-date="{ row }">
      <span class="whitespace-nowrap text-muted">{{
        formatNumericDateTime(row.date, locale.locale)
      }}</span>
    </template>
    <template v-if="$slots.empty" #empty><slot name="empty" /></template>
    <template v-if="$slots.footer" #footer><slot name="footer" /></template>
  </AdminDataTable>
</template>
