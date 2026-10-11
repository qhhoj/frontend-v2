<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { CommentPageLink } from '@/api/types/comments';
import EmptyState from '@/components/EmptyState.vue';
import GlassCard from '@/components/GlassCard.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { commentPageRoute } from '@/lib/comment-links';
import { pageFromQuery } from '@/lib/paging';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { ADMIN_BUTTON_CLASS } from '../ui/classes';
import { useCommentLocksQuery, useUnlockPage } from './comment-locks.queries';

/** Legacy `CommentLockAdmin` (`judge.change_comment`): every page whose comments are locked, newest lock first; unlock from here. */
const route = useRoute();
const page = computed(() => pageFromQuery(route.query.page));
const { data, isPending, error, refetch } = useCommentLocksQuery(page);
const items = computed(() => data.value?.items ?? []);
const unlock = useUnlockPage();
const unlocked = ref<string | null>(null);
const keyOf = (link: CommentPageLink) => `${link.type}:${link.key}`;

async function unlockPage(link: CommentPageLink) {
  unlocked.value = null;
  await unlock.run(link);
  if (unlock.isDone.value) unlocked.value = link.title;
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-[1080px] flex-col gap-6">
    <AdminPageHeader
      :title="$t('admin.comments.locks.title')"
      :lead="$t('admin.comments.locks.lead')"
    />
    <AdminStatus
      v-if="unlocked"
      kind="done"
      :text="$t('admin.comments.locks.unlocked', { title: unlocked })"
    />
    <AdminStatus
      v-if="unlock.failure.value"
      kind="refused"
      :text="failureTextOf(unlock.failure.value)"
    />
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton><SkeletonBlock class="h-48 w-full" /></template>
      <GlassCard v-if="items.length === 0" as="div">
        <EmptyState>{{ $t('admin.comments.locks.empty') }}</EmptyState>
      </GlassCard>
      <GlassCard v-else as="div" class="p-2 sm:p-3">
        <ul class="divide-y divide-line">
          <li
            v-for="link in items"
            :key="keyOf(link)"
            class="flex flex-wrap items-center gap-x-3 gap-y-2 px-2 py-3"
          >
            <div class="flex min-w-0 flex-1 flex-col">
              <RouterLink
                v-if="commentPageRoute(link)"
                :to="commentPageRoute(link)!"
                class="truncate font-semibold text-accent-text hover:underline"
              >
                {{ link.title }}
              </RouterLink>
              <span v-else class="truncate font-semibold">{{ link.title }}</span>
              <span class="text-sm text-muted">
                {{ $t(`admin.comments.all.pageTypes.${link.type}`) }} ·
                <span class="font-mono">{{ link.key }}</span>
              </span>
            </div>
            <button
              type="button"
              :class="ADMIN_BUTTON_CLASS"
              :aria-disabled="unlock.isPending.value || undefined"
              @click="unlock.isPending.value || unlockPage(link)"
            >
              {{ $t('admin.comments.locks.unlock') }}
            </button>
          </li>
        </ul>
      </GlassCard>
      <NumberedPager v-if="data" :meta="data.meta" :label="$t('admin.comments.locks.pager')" />
    </QueryState>
  </div>
</template>
