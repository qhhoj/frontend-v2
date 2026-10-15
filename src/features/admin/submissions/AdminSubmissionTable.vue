<script setup lang="ts">
import { Copy, ExternalLink } from 'lucide-vue-next';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { NumberedPageMeta } from '@/api/client';
import type { SubmissionListItem } from '@/api/types/submissions';
import UserLink from '@/components/UserLink.vue';
import VerdictBadge from '@/components/VerdictBadge.vue';
import SubmissionProblemName from '@/features/submissions/SubmissionProblemName.vue';
import { formatCaseMemory, formatCaseTime } from '@/lib/format';
import { copyText } from '@/lib/clipboard';
import { submissionVerdictOf } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import { useAdminToast } from '../ui/feedback/use-admin-toast';
import { shortId } from '../ui/short-id';
import { SITE_TIME_ZONE, formatInZone } from '../ui/form/site-time';
import AdminDataTable from '../ui/table/AdminDataTable.vue';
import AdminRowMenu from '../ui/table/AdminRowMenu.vue';
import type { RowMenuItem } from '../ui/table/AdminRowMenu.vue';
import type { AdminColumn } from '../ui/table/table-columns';
import { formatShortSiteTime } from './submission-time';

/**
 * Staff columns of the old changelist (time, memory, points, language); cards below 768 px. The verdict opens the submission
 * and the ⋯ menu copies its id; the id itself is not a column. With `selectable`, the checkbox
 * column drives `selected` and the `bulk` slot replaces the toolbar while rows are picked.
 */
defineProps<{
  items: SubmissionListItem[];
  label: string;
  selectable?: boolean;
  pager?: { meta: NumberedPageMeta; label: string };
}>();
const selected = defineModel<Set<string>>('selected', { default: () => new Set<string>() });
defineSlots<{ bulk?: () => unknown; empty?: () => unknown }>();
const { t } = useI18n();
const locale = useLocaleStore();
const toast = useAdminToast();

const NUMBER_CELL = 'whitespace-nowrap';
const columns = computed<AdminColumn[]>(() => [
  {
    key: 'verdict',
    label: t('admin.submissions.table.verdict'),
    priority: 'badge',
    cellClass: 'w-20',
  },
  { key: 'user', label: t('admin.submissions.table.user'), cellClass: 'max-w-48' },
  {
    key: 'problem',
    label: t('admin.submissions.table.problem'),
    priority: 'primary',
    cellClass: 'w-full max-w-0',
  },
  {
    key: 'points',
    label: t('admin.submissions.table.points'),
    align: 'end',
    cellClass: NUMBER_CELL,
  },
  {
    key: 'time',
    label: t('admin.submissions.table.time'),
    align: 'end',
    priority: 'meta',
    cellClass: NUMBER_CELL,
  },
  {
    key: 'memory',
    label: t('admin.submissions.table.memory'),
    align: 'end',
    priority: 'meta',
    cellClass: NUMBER_CELL,
  },
  {
    key: 'language',
    label: t('admin.submissions.table.language'),
    priority: 'meta',
    cellClass: 'max-w-32 truncate',
  },
  {
    key: 'date',
    label: t('admin.submissions.table.date'),
    priority: 'meta',
    cellClass: NUMBER_CELL,
  },
]);
const pointsText = (item: SubmissionListItem) =>
  item.points === null || !item.problem ? '—' : `${item.points} / ${item.problem.points}`;

async function copyId(id: string) {
  const isCopied = await copyText(id);
  toast.show(
    isCopied
      ? { text: t('admin.submissions.menu.copied'), tone: 'success' }
      : { text: t('admin.submissions.menu.copyFailed'), tone: 'error' },
  );
}
const menuItems = (row: SubmissionListItem): RowMenuItem[] => [
  {
    label: t('admin.submissions.menu.open'),
    icon: ExternalLink,
    to: { name: 'submission', params: { id: row.id } },
  },
  { label: t('admin.submissions.menu.copyId'), icon: Copy, run: () => void copyId(row.id) },
];
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
    :pager="pager"
  >
    <template #bulk><slot name="bulk" /></template>
    <template #cell-verdict="{ row }">
      <RouterLink
        :to="{ name: 'submission', params: { id: row.id } }"
        class="inline-flex rounded-full hover:brightness-110"
      >
        <VerdictBadge :verdict="submissionVerdictOf(row)" size="sm" class="min-w-12" />
      </RouterLink>
    </template>
    <template #cell-user="{ row }">
      <UserLink v-if="row.user" :username="row.user.username" :rating="row.user.rating" />
      <span v-else class="text-muted">—</span>
    </template>
    <template #cell-problem="{ row }">
      <div v-if="row.problem" class="flex min-w-0 items-baseline gap-2">
        <div class="max-w-[65%] min-w-0 shrink-0">
          <SubmissionProblemName :problem="row.problem" />
        </div>
        <span class="min-w-0 truncate font-mono text-xs text-muted">{{ row.problem.code }}</span>
      </div>
      <span v-else class="text-muted">—</span>
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
      <time
        class="text-muted"
        :datetime="row.date"
        :title="`${formatInZone(row.date)} (${SITE_TIME_ZONE})`"
        >{{ formatShortSiteTime(row.date, locale.locale) }}</time
      >
    </template>
    <template #actions="{ row }">
      <AdminRowMenu
        :label="$t('admin.submissions.menu.label', { user: row.user?.username ?? '—' })"
        :items="menuItems(row)"
      />
    </template>
    <template v-if="$slots.empty" #empty><slot name="empty" /></template>
  </AdminDataTable>
</template>
