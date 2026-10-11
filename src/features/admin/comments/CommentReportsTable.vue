<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { CheckCheck, Eye, EyeOff, X } from 'lucide-vue-next';
import type { TotalPageMeta } from '@/api/client';
import type { CommentReportOutcome, CommentReportQueueItem } from '@/api/types/comments';
import NumberedPager from '@/components/NumberedPager.vue';
import UserName from '@/components/UserName.vue';
import { formatDateTime } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdminChip from '../ui/AdminChip.vue';
import { buttonClass } from '../ui/controls';
import AdminDataTable from '../ui/table/AdminDataTable.vue';
import AdminRowMenu from '../ui/table/AdminRowMenu.vue';
import type { RowMenuItem } from '../ui/table/AdminRowMenu.vue';
import { rangeOf } from '../ui/table/table-columns';
import type { AdminColumn } from '../ui/table/table-columns';
import CommentExcerpt from './CommentExcerpt.vue';
import CommentPlace from './CommentPlace.vue';

/**
 * Reported comments, one row per comment with each report's reason as a chip. On the open tab the row's one visible action
 * is "Ẩn và xử lý" (or "Đã xử lý" once hidden); show or hide alone and dismiss sit in its "⋯" menu.
 */
const props = defineProps<{
  items: CommentReportQueueItem[];
  meta: TotalPageMeta | undefined;
  loading: boolean;
  error: unknown;
  isOpenTab: boolean;
  isBusy: (item: CommentReportQueueItem) => boolean;
  isSettling: (item: CommentReportQueueItem) => boolean;
}>();
const selected = defineModel<Set<string>>('selected', { required: true });
const emit = defineEmits<{
  retry: [];
  settle: [item: CommentReportQueueItem, outcome: CommentReportOutcome];
  changeHidden: [item: CommentReportQueueItem, hidden: boolean, resolve: boolean];
}>();
const { t } = useI18n();
const locale = useLocaleStore();
const columns = computed<AdminColumn[]>(() => [
  { key: 'comment', label: t('admin.comments.columns.comment'), priority: 'primary' },
  { key: 'state', label: t('admin.comments.columns.state'), priority: 'badge' },
  { key: 'reports', label: t('admin.comments.columns.reports') },
  { key: 'page', label: t('admin.comments.columns.page') },
  { key: 'when', label: t('admin.comments.columns.when'), priority: 'meta' },
]);
const range = computed(() =>
  props.meta
    ? rangeOf(props.meta.page, props.meta.pageSize, props.items.length, props.meta.total)
    : null,
);
const when = (item: CommentReportQueueItem) =>
  formatDateTime(item.lastSettledAt ?? item.lastReportedAt, locale.locale);
const canHideAndResolve = (item: CommentReportQueueItem) =>
  !item.comment.deleted && !item.comment.hidden;

const menuItems = (item: CommentReportQueueItem): RowMenuItem[] => [
  ...(item.comment.deleted
    ? []
    : [
        {
          label: item.comment.hidden ? t('admin.comments.show') : t('admin.comments.hide'),
          icon: item.comment.hidden ? Eye : EyeOff,
          disabled: props.isBusy(item),
          run: () => emit('changeHidden', item, !item.comment.hidden, false),
        },
      ]),
  ...(canHideAndResolve(item)
    ? [
        {
          label: t('admin.comments.resolve'),
          icon: CheckCheck,
          disabled: props.isSettling(item),
          run: () => emit('settle', item, 'resolved'),
        },
      ]
    : []),
  {
    label: t('admin.comments.dismiss'),
    icon: X,
    disabled: props.isSettling(item),
    run: () => emit('settle', item, 'dismissed'),
  },
];
const rowName = (item: CommentReportQueueItem) =>
  t('admin.comments.rowName', { page: item.page.title });
</script>

<template>
  <AdminDataTable
    v-model:selected="selected"
    :columns="columns"
    :rows="items"
    :row-key="(item) => item.comment.id"
    :row-label="rowName"
    :row-attrs="(item) => ({ 'data-comment': item.comment.id })"
    :label="$t('admin.comments.title')"
    :selectable="isOpenTab"
    :loading="loading"
    :error="error"
    :empty-text="isOpenTab ? $t('admin.comments.empty') : $t('admin.comments.emptySettled')"
    @retry="$emit('retry')"
  >
    <template #bulk><slot name="bulk" /></template>
    <template #cell-comment="{ row }"><CommentExcerpt :comment="row.comment" /></template>
    <template #cell-state="{ row }">
      <AdminChip v-if="row.comment.deleted">{{ $t('admin.comments.chips.deleted') }}</AdminChip>
      <AdminChip v-else-if="row.comment.hidden" tone="caution" :icon="EyeOff">
        {{ $t('admin.comments.chips.hidden') }}
      </AdminChip>
    </template>
    <template #cell-reports="{ row }">
      <ul class="m-0 flex max-w-md list-none flex-col gap-1 p-0 py-2">
        <li
          v-for="(report, index) in row.reports"
          :key="index"
          class="flex flex-wrap items-center gap-x-2 gap-y-1"
        >
          <AdminChip :tone="report.status === 'open' ? 'negative' : 'neutral'">
            {{ $t(`comments.report.reason.${report.reason}`) }}
          </AdminChip>
          <UserName
            v-if="report.reporter"
            :username="report.reporter.username"
            :rating="report.reporter.rating"
          />
          <span v-if="report.note" class="text-muted">“{{ report.note }}”</span>
          <span v-if="report.status !== 'open'" class="text-xs text-muted">
            {{ $t(`admin.comments.outcome.${report.status}`) }}
            <template v-if="report.settledBy">
              · {{ $t('admin.comments.settledBy', { name: report.settledBy.username }) }}
            </template>
          </span>
        </li>
      </ul>
    </template>
    <template #cell-page="{ row }"><CommentPlace :item="row" /></template>
    <template #cell-when="{ row }">
      <span class="flex flex-col whitespace-nowrap">
        <span>{{ when(row) }}</span>
        <span class="text-xs text-muted">
          {{ $t('admin.comments.reporters', { count: row.reporterCount }, row.reporterCount) }}
        </span>
      </span>
    </template>
    <template v-if="isOpenTab" #actions="{ row }">
      <button
        v-if="canHideAndResolve(row)"
        type="button"
        :class="buttonClass('secondary', 'sm')"
        :aria-disabled="isBusy(row) || undefined"
        @click="isBusy(row) || $emit('changeHidden', row, true, true)"
      >
        {{ $t('admin.comments.hideAndResolve') }}
      </button>
      <button
        v-else
        type="button"
        :class="buttonClass('secondary', 'sm')"
        :aria-disabled="isSettling(row) || undefined"
        @click="isSettling(row) || $emit('settle', row, 'resolved')"
      >
        {{ $t('admin.comments.resolve') }}
      </button>
      <AdminRowMenu
        :label="$t('admin.table.rowMenu', { name: rowName(row) })"
        :items="menuItems(row)"
      />
    </template>
    <template v-if="meta" #footer>
      <span v-if="range" class="font-mono tabular-nums">{{ $t('admin.table.range', range) }}</span>
      <NumberedPager class="ml-auto" compact :meta="meta" :label="$t('admin.comments.pager')" />
    </template>
  </AdminDataTable>
</template>
