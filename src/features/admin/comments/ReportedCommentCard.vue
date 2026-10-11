<script setup lang="ts">
import type { CommentReportQueueItem } from '@/api/types/comments';
import GlassCard from '@/components/GlassCard.vue';
import UserName from '@/components/UserName.vue';
import { commentRoute } from '@/lib/comment-links';
import { formatDateTime } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';

/** One reported comment: where it is, who wrote it, its reports (with the outcome once settled), then the caller's actions. */
const props = defineProps<{ item: CommentReportQueueItem; selectable: boolean }>();
const selected = defineModel<boolean>('selected', { default: false });
const locale = useLocaleStore();
const CHIP = 'rounded-pill bg-surface-hover px-2.5 py-0.5 text-xs font-semibold';
const when = () =>
  formatDateTime(props.item.lastSettledAt ?? props.item.lastReportedAt, locale.locale);
</script>

<template>
  <GlassCard as="article" class="flex gap-3 p-4 sm:p-5">
    <input
      v-if="selectable"
      v-model="selected"
      type="checkbox"
      class="mt-1 size-5 shrink-0 accent-[var(--qh-accent)]"
      :aria-label="$t('admin.comments.select', { page: item.page.title })"
    />
    <div class="flex min-w-0 flex-1 flex-col gap-3">
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
          {{ $t('admin.comments.reporters', { count: item.reporterCount }, item.reporterCount) }}
          · {{ when() }}
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
        <span v-else class="font-semibold text-muted">{{ $t('comments.deletedAccount') }}</span>
        <p class="mt-1 break-words whitespace-pre-wrap text-muted">
          {{ item.comment.excerpt || $t('comments.deleted.placeholder') }}
        </p>
      </blockquote>
      <ul class="flex flex-col gap-1.5 text-sm">
        <li v-for="(report, index) in item.reports" :key="index" class="flex flex-wrap gap-x-2">
          <UserName
            v-if="report.reporter"
            :username="report.reporter.username"
            :rating="report.reporter.rating"
          />
          <span class="font-semibold">{{ $t(`comments.report.reason.${report.reason}`) }}</span>
          <span v-if="report.note" class="text-muted">“{{ report.note }}”</span>
          <span v-if="report.status !== 'open'" :class="CHIP">
            {{ $t(`admin.comments.outcome.${report.status}`) }}
            <template v-if="report.settledBy">
              · {{ $t('admin.comments.settledBy', { name: report.settledBy.username }) }}
            </template>
          </span>
        </li>
      </ul>
      <slot />
    </div>
  </GlassCard>
</template>
