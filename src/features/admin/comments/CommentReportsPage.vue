<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { BULK_SETTLE_MAX } from '@/api/types/comments';
import type {
  CommentReportOutcome,
  CommentReportQueue,
  CommentReportQueueItem,
} from '@/api/types/comments';
import { pageFromQuery } from '@/lib/paging';
import { adminRouteName } from '../admin-screens';
import AdminFilterTabs from '../ui/AdminFilterTabs.vue';
import type { AdminFilterTab } from '../ui/AdminFilterTabs.vue';
import { failureTextOf } from '../ui/admin-errors';
import { buttonClass } from '../ui/controls';
import AdminNotice from '../ui/feedback/AdminNotice.vue';
import { useAdminToast } from '../ui/feedback/use-admin-toast';
import CommentReportsTable from './CommentReportsTable.vue';
import CommentsSectionHeader from './CommentsSectionHeader.vue';
import {
  useBulkSettle,
  useCommentReportsQuery,
  useReportedCommentHide,
  useSettleReports,
} from './comment-reports.queries';

/** The moderators' queue of reported comments (`judge.change_comment`): open reports, newest first, to act on one or many; the settled tab keeps what was decided. */
const { t } = useI18n();
const toast = useAdminToast();
const route = useRoute();
const status = computed<CommentReportQueue>(() =>
  route.query.status === 'settled' ? 'settled' : 'open',
);
const page = computed(() => pageFromQuery(route.query.page));
const { data, isPending, error, refetch } = useCommentReportsQuery(page, true, status);
const items = computed(() => data.value?.items ?? []);
const isOpenTab = computed(() => status.value === 'open');
/** The open tab's count, on both tabs: the same cache entry as the list when the open tab shows. */
const openQuery = useCommentReportsQuery(1);
const tabs = computed<AdminFilterTab[]>(() => [
  {
    key: 'open',
    label: t('admin.comments.tabs.open'),
    to: { name: adminRouteName('commentReports') },
    count: openQuery.data.value?.meta.total ?? 0,
  },
  {
    key: 'settled',
    label: t('admin.comments.tabs.settled'),
    to: { name: adminRouteName('commentReports'), query: { status: 'settled' } },
  },
]);

const settle = useSettleReports();
async function settleReports(item: CommentReportQueueItem, outcome: CommentReportOutcome) {
  try {
    await settle.mutateAsync({ id: item.comment.id, outcome });
    toast.show({ text: t(`admin.comments.settled.${outcome}`) });
  } catch {
    toast.show({ text: t('admin.comments.settleFailed'), tone: 'error' });
  }
}

/** Ticked comments of the shown page; another page or tab starts with none. */
const selected = ref(new Set<string>());
watch(
  () => route.query,
  () => (selected.value = new Set()),
);
const bulk = useBulkSettle();
async function settleSelected(outcome: CommentReportOutcome) {
  if (bulk.isPending.value) return;
  const outcomes = await bulk.run({ ids: [...selected.value].slice(0, BULK_SETTLE_MAX), outcome });
  if (!outcomes) return;
  const refused = outcomes.filter((row) => row.code).length;
  toast.show({
    text: t(`admin.comments.bulk.result.${outcome}`, { done: outcomes.length - refused, refused }),
    tone: refused ? 'error' : 'success',
  });
  selected.value = new Set();
}

const hider = useReportedCommentHide();
const hidingId = ref<string | null>(null);
/** Hide (and maybe resolve) or show the comment from its card, without opening its page. */
async function changeHidden(item: CommentReportQueueItem, hidden: boolean, resolve: boolean) {
  hidingId.value = item.comment.id;
  try {
    await hider.run({ id: item.comment.id, hidden, resolve });
  } finally {
    hidingId.value = null;
  }
  if (!hider.isDone.value) return;
  const key = resolve ? 'hiddenResolved' : hidden ? 'hidden' : 'shown';
  toast.show({ text: t(`admin.comments.${key}`) });
}
const isSettling = (item: CommentReportQueueItem) =>
  bulk.isPending.value ||
  (settle.isPending.value && settle.variables.value?.id === item.comment.id);
const isBusy = (item: CommentReportQueueItem) =>
  isSettling(item) || hidingId.value === item.comment.id;
</script>

<template>
  <div class="flex w-full flex-col gap-4">
    <CommentsSectionHeader :lead="$t('admin.comments.lead')" />
    <AdminFilterTabs :tabs="tabs" :current="status" :label="$t('admin.comments.tabs.label')" />

    <AdminNotice
      v-if="hider.failure.value"
      tone="danger"
      :title="failureTextOf(hider.failure.value)"
    />
    <AdminNotice
      v-if="bulk.failure.value"
      tone="danger"
      :title="failureTextOf(bulk.failure.value)"
    />

    <CommentReportsTable
      v-model:selected="selected"
      :items="items"
      :meta="data?.meta"
      :loading="isPending"
      :error="error"
      :is-open-tab="isOpenTab"
      :is-busy="isBusy"
      :is-settling="isSettling"
      @retry="refetch()"
      @settle="settleReports"
      @change-hidden="changeHidden"
    >
      <template #bulk>
        <button
          type="button"
          :class="buttonClass('secondary', 'sm')"
          :aria-disabled="bulk.isPending.value || undefined"
          @click="settleSelected('resolved')"
        >
          {{ $t('admin.comments.bulk.resolve') }}
        </button>
        <button
          type="button"
          :class="buttonClass('secondary', 'sm')"
          :aria-disabled="bulk.isPending.value || undefined"
          @click="settleSelected('dismissed')"
        >
          {{ $t('admin.comments.bulk.dismiss') }}
        </button>
      </template>
    </CommentReportsTable>
  </div>
</template>
