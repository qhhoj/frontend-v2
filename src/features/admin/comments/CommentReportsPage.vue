<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { BULK_SETTLE_MAX } from '@/api/types/comments';
import type {
  CommentReportOutcome,
  CommentReportQueue,
  CommentReportQueueItem,
} from '@/api/types/comments';
import EmptyState from '@/components/EmptyState.vue';
import GlassCard from '@/components/GlassCard.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { pageFromQuery } from '@/lib/paging';
import { adminRouteName } from '../admin-screens';
import AdminBulkBar from '../ui/AdminBulkBar.vue';
import AdminFilterTabs from '../ui/AdminFilterTabs.vue';
import type { AdminFilterTab } from '../ui/AdminFilterTabs.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { ADMIN_BUTTON_CLASS, ADMIN_PRIMARY_CLASS } from '../ui/classes';
import { useSelection } from '../ui/use-selection';
import ReportedCommentCard from './ReportedCommentCard.vue';
import {
  useBulkSettle,
  useCommentReportsQuery,
  useReportedCommentHide,
  useSettleReports,
} from './comment-reports.queries';

/** The moderators' queue of reported comments (`judge.change_comment`): open reports, newest first, to act on one or many; the settled tab keeps what was decided. */
const { t } = useI18n();
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

const result = ref<{ kind: 'done' | 'refused'; text: string } | null>(null);
const settle = useSettleReports();
async function settleReports(item: CommentReportQueueItem, outcome: CommentReportOutcome) {
  result.value = null;
  try {
    await settle.mutateAsync({ id: item.comment.id, outcome });
    result.value = { kind: 'done', text: t(`admin.comments.settled.${outcome}`) };
  } catch {
    result.value = { kind: 'refused', text: t('admin.comments.settleFailed') };
  }
}

const selection = useSelection(() => items.value.map((item) => item.comment.id), BULK_SETTLE_MAX);
const bulk = useBulkSettle();
async function settleSelected(outcome: CommentReportOutcome) {
  result.value = null;
  const outcomes = await bulk.run({ ids: [...selection.selected.value], outcome });
  if (!outcomes) return;
  const refused = outcomes.filter((row) => row.code).length;
  result.value = {
    kind: refused ? 'refused' : 'done',
    text: t(`admin.comments.bulk.result.${outcome}`, {
      done: outcomes.length - refused,
      refused,
    }),
  };
}

const hider = useReportedCommentHide();
const hidingId = ref<string | null>(null);
/** Hide (and maybe resolve) or show the comment from its card, without opening its page. */
async function changeHidden(item: CommentReportQueueItem, hidden: boolean, resolve: boolean) {
  result.value = null;
  hidingId.value = item.comment.id;
  try {
    await hider.run({ id: item.comment.id, hidden, resolve });
  } finally {
    hidingId.value = null;
  }
  if (!hider.isDone.value) return;
  const key = resolve ? 'hiddenResolved' : hidden ? 'hidden' : 'shown';
  result.value = { kind: 'done', text: t(`admin.comments.${key}`) };
}
const isSettling = (item: CommentReportQueueItem) =>
  bulk.isPending.value ||
  (settle.isPending.value && settle.variables.value?.id === item.comment.id);
const isBusy = (item: CommentReportQueueItem) =>
  isSettling(item) || hidingId.value === item.comment.id;
const cannotBulk = computed(() => selection.selected.value.size === 0 || bulk.isPending.value);
</script>

<template>
  <div class="mx-auto flex w-full max-w-[1080px] flex-col gap-6">
    <AdminPageHeader :title="$t('admin.comments.title')" :lead="$t('admin.comments.lead')" />
    <AdminFilterTabs :tabs="tabs" :current="status" :label="$t('admin.comments.tabs.label')" />

    <AdminBulkBar
      v-if="isOpenTab"
      :label="$t('admin.comments.bulk.label')"
      :count-text="
        $t(
          'admin.comments.all.bulk.count',
          { count: selection.selected.value.size },
          selection.selected.value.size,
        )
      "
      :all-selected="selection.allSelected.value"
      :can-select="items.length > 0"
      @toggle-all="selection.toggleAll()"
    >
      <button
        type="button"
        :class="ADMIN_BUTTON_CLASS"
        :aria-disabled="cannotBulk || undefined"
        @click="cannotBulk || settleSelected('resolved')"
      >
        {{ $t('admin.comments.bulk.resolve') }}
      </button>
      <button
        type="button"
        :class="ADMIN_BUTTON_CLASS"
        :aria-disabled="cannotBulk || undefined"
        @click="cannotBulk || settleSelected('dismissed')"
      >
        {{ $t('admin.comments.bulk.dismiss') }}
      </button>
    </AdminBulkBar>

    <AdminStatus v-if="result" :kind="result.kind" :text="result.text" />
    <AdminStatus
      v-if="hider.failure.value"
      kind="refused"
      :text="failureTextOf(hider.failure.value)"
    />
    <AdminStatus
      v-if="bulk.failure.value"
      kind="refused"
      :text="failureTextOf(bulk.failure.value)"
    />

    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton><SkeletonBlock class="h-48 w-full" /></template>
      <GlassCard v-if="items.length === 0" as="div">
        <EmptyState>{{
          isOpenTab ? $t('admin.comments.empty') : $t('admin.comments.emptySettled')
        }}</EmptyState>
      </GlassCard>
      <ol v-else class="flex flex-col gap-4">
        <li v-for="item in items" :key="item.comment.id">
          <ReportedCommentCard
            :item="item"
            :selectable="isOpenTab"
            :selected="selection.selected.value.has(item.comment.id)"
            @update:selected="selection.setSelected(item.comment.id, $event)"
          >
            <div v-if="isOpenTab" class="flex flex-wrap gap-2">
              <template v-if="!item.comment.deleted">
                <button
                  v-if="!item.comment.hidden"
                  type="button"
                  :class="ADMIN_PRIMARY_CLASS"
                  :aria-disabled="isBusy(item) || undefined"
                  @click="isBusy(item) || changeHidden(item, true, true)"
                >
                  {{ $t('admin.comments.hideAndResolve') }}
                </button>
                <button
                  type="button"
                  :class="ADMIN_BUTTON_CLASS"
                  :aria-disabled="isBusy(item) || undefined"
                  @click="isBusy(item) || changeHidden(item, !item.comment.hidden, false)"
                >
                  {{ item.comment.hidden ? $t('admin.comments.show') : $t('admin.comments.hide') }}
                </button>
              </template>
              <button
                type="button"
                :class="ADMIN_BUTTON_CLASS"
                :aria-disabled="isSettling(item) || undefined"
                @click="isSettling(item) || settleReports(item, 'resolved')"
              >
                {{ $t('admin.comments.resolve') }}
              </button>
              <button
                type="button"
                :class="ADMIN_BUTTON_CLASS"
                :aria-disabled="isSettling(item) || undefined"
                @click="isSettling(item) || settleReports(item, 'dismissed')"
              >
                {{ $t('admin.comments.dismiss') }}
              </button>
            </div>
          </ReportedCommentCard>
        </li>
      </ol>
      <NumberedPager v-if="data" :meta="data.meta" :label="$t('admin.comments.pager')" />
    </QueryState>
  </div>
</template>
