<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { CommentReportOutcome, CommentReportQueueItem } from '@/api/types/comments';
import EmptyState from '@/components/EmptyState.vue';
import GlassCard from '@/components/GlassCard.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import UserName from '@/components/UserName.vue';
import { commentRoute } from '@/lib/comment-links';
import { formatDateTime } from '@/lib/format';
import { pageFromQuery } from '@/lib/paging';
import { useLocaleStore } from '@/stores/locale.store';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { ADMIN_BUTTON_CLASS } from '../ui/classes';
import { useCommentReportsQuery, useSettleReports } from './comment-reports.queries';

/** The moderators' queue of reported comments (`judge.change_comment`): newest report first; open the comment, then resolve or dismiss its reports. */
const route = useRoute();
const locale = useLocaleStore();
const page = computed(() => pageFromQuery(route.query.page));
const { data, isPending, error, refetch } = useCommentReportsQuery(page);
const items = computed(() => data.value?.items ?? []);
const settle = useSettleReports();
const result = ref<{ kind: 'done' | 'refused'; key: string } | null>(null);

async function settleReports(item: CommentReportQueueItem, outcome: CommentReportOutcome) {
  result.value = null;
  try {
    await settle.mutateAsync({ id: item.comment.id, outcome });
    result.value = { kind: 'done', key: `admin.comments.settled.${outcome}` };
  } catch {
    result.value = { kind: 'refused', key: 'admin.comments.settleFailed' };
  }
}
const isSettling = (item: CommentReportQueueItem) =>
  settle.isPending.value && settle.variables.value?.id === item.comment.id;
const CHIP = 'rounded-pill bg-surface-hover px-2.5 py-0.5 text-xs font-semibold';
</script>

<template>
  <div class="mx-auto flex max-w-[1080px] flex-col gap-6">
    <AdminPageHeader
      :crumbs="[
        { label: $t('admin.comments.crumbs.content') },
        { label: $t('admin.comments.crumbs.reports') },
      ]"
      :title="$t('admin.comments.title')"
      :lead="$t('admin.comments.lead')"
    />
    <AdminStatus v-if="result" :kind="result.kind" :text="$t(result.key)" />

    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton><SkeletonBlock class="h-48 w-full" /></template>
      <GlassCard v-if="items.length === 0" as="div">
        <EmptyState>{{ $t('admin.comments.empty') }}</EmptyState>
      </GlassCard>
      <ol v-else class="flex flex-col gap-4">
        <li v-for="item in items" :key="item.comment.id">
          <GlassCard as="article" class="flex flex-col gap-3 p-4 sm:p-5">
            <header class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <RouterLink
                v-if="commentRoute(item.page, item.comment.id)"
                :to="commentRoute(item.page, item.comment.id)!"
                class="font-semibold text-accent-text hover:underline"
              >
                {{ item.page.title }}
              </RouterLink>
              <span v-else class="font-semibold">{{ item.page.title }}</span>
              <span class="text-sm text-muted">
                {{
                  $t('admin.comments.reporters', { count: item.reporterCount }, item.reporterCount)
                }}
                · {{ formatDateTime(item.lastReportedAt, locale.locale) }}
              </span>
              <span v-if="item.comment.hidden" :class="CHIP">{{
                $t('admin.comments.chips.hidden')
              }}</span>
              <span v-if="item.comment.deleted" :class="CHIP">{{
                $t('admin.comments.chips.deleted')
              }}</span>
            </header>
            <blockquote class="rounded-row bg-surface-strong px-3 py-2 text-sm">
              <UserName
                v-if="item.comment.author"
                :username="item.comment.author.username"
                :rating="item.comment.author.rating"
              />
              <span v-else class="font-semibold text-muted">{{
                $t('comments.deletedAccount')
              }}</span>
              <p class="mt-1 break-words whitespace-pre-wrap text-muted">
                {{ item.comment.excerpt || $t('comments.deleted.placeholder') }}
              </p>
            </blockquote>
            <ul class="flex flex-col gap-1.5 text-sm">
              <li
                v-for="(report, index) in item.reports"
                :key="index"
                class="flex flex-wrap gap-x-2"
              >
                <UserName
                  v-if="report.reporter"
                  :username="report.reporter.username"
                  :rating="report.reporter.rating"
                />
                <span class="font-semibold">{{
                  $t(`comments.report.reason.${report.reason}`)
                }}</span>
                <span v-if="report.note" class="text-muted">“{{ report.note }}”</span>
              </li>
            </ul>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                :class="ADMIN_BUTTON_CLASS"
                :aria-disabled="isSettling(item) || undefined"
                @click="settleReports(item, 'resolved')"
              >
                {{ $t('admin.comments.resolve') }}
              </button>
              <button
                type="button"
                :class="ADMIN_BUTTON_CLASS"
                :aria-disabled="isSettling(item) || undefined"
                @click="settleReports(item, 'dismissed')"
              >
                {{ $t('admin.comments.dismiss') }}
              </button>
            </div>
          </GlassCard>
        </li>
      </ol>
      <NumberedPager v-if="data" :meta="data.meta" :label="$t('admin.comments.pager')" />
    </QueryState>
  </div>
</template>
