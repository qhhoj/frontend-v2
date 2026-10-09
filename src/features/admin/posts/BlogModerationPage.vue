<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import type { RouteLocationRaw } from 'vue-router';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { hidePost } from '@/api/blog-admin.api';
import type { PostListItem } from '@/api/types/blog';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import SettingsNotice from '@/features/account/settings/SettingsNotice.vue';
import AdminBit from '../shell/AdminBit.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import type { AdminQueryKey } from '../ui/use-admin-mutation';
import { failureTextOf } from '../ui/admin-errors';
import { useAdminMutation } from '../ui/use-admin-mutation';
import { adminRouteName } from '../admin-screens';
import ModerationPostsQueue from './ModerationPostsQueue.vue';
import PublicPostsQueue from './PublicPostsQueue.vue';
import { MODERATION_FEEDS, feedFromQuery, isQueueFeed, pageFromQuery } from './moderation';
import type { ModerationFeed, RowFailure } from './moderation';

const route = useRoute();
const queryClient = useQueryClient();
const feed = computed(() => feedFromQuery(route.query.feed));
const page = computed(() => pageFromQuery(route.query.page));
const TABS: { feed: ModerationFeed; to: RouteLocationRaw }[] = MODERATION_FEEDS.map((tabFeed) => ({
  feed: tabFeed,
  to: { name: adminRouteName('posts'), query: tabFeed === 'all' ? {} : { feed: tabFeed } },
}));
const TAB =
  'inline-flex min-h-11 items-center rounded-pill px-4 font-semibold hover:bg-surface-hover aria-[selected=true]:bg-accent-soft aria-[selected=true]:text-accent-soft-text';

const hidingPost = ref<PostListItem | null>(null);
const isHideOpen = ref(false);
const rowFailure = ref<RowFailure | null>(null);
const {
  run: runHide,
  isPending: isHiding,
  isDone: isHidden,
  failure: hideFailure,
} = useAdminMutation({
  mutate: (post: PostListItem) => hidePost(post.id),
  invalidates: (): AdminQueryKey[] => [['admin', 'posts']],
  onDone: () => void queryClient.invalidateQueries({ queryKey: ['posts'] }),
});

function openHide(post: PostListItem) {
  hidingPost.value = post;
  isHideOpen.value = true;
}

/** The dialog closes either way; a refusal stays on the post's row, as its text. */
async function confirmHide() {
  const post = hidingPost.value;
  if (post === null) return;
  await runHide(post);
  isHideOpen.value = false;
  rowFailure.value = hideFailure.value && {
    postId: post.id,
    text: failureTextOf(hideFailure.value),
  };
}
</script>

<template>
  <div class="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 py-6 sm:px-8">
    <AdminPageHeader
      :crumbs="[
        { label: $t('admin.posts.crumbs.content') },
        { label: $t('admin.posts.crumbs.blog') },
      ]"
      :title="$t('admin.posts.title')"
    >
      <template #actions><AdminBit placement="composing" /></template>
    </AdminPageHeader>

    <div class="flex flex-col gap-2">
      <nav :aria-label="$t('admin.posts.feeds.label')">
        <div role="tablist" class="glass flex flex-wrap gap-1 rounded-pill p-1">
          <RouterLink
            v-for="tab in TABS"
            :key="tab.feed"
            v-slot="{ href, navigate }"
            custom
            :to="tab.to"
          >
            <a
              :href="href"
              role="tab"
              :aria-selected="feed === tab.feed"
              :class="TAB"
              @click="navigate"
            >
              {{ $t(`admin.posts.feeds.${tab.feed}`) }}
            </a>
          </RouterLink>
        </div>
      </nav>
      <p class="text-sm text-muted">{{ $t('admin.posts.feeds.note') }}</p>
    </div>

    <AdminStatus v-if="isHidden" kind="done" :text="$t('admin.posts.hide.done')" />
    <SettingsNotice tone="info">{{ $t('admin.posts.gap') }}</SettingsNotice>

    <ModerationPostsQueue
      v-if="isQueueFeed(feed)"
      :feed="feed"
      :page="page"
      :row-failure="rowFailure"
      @hide="openHide"
    />
    <PublicPostsQueue v-else :feed="feed" :page="page" :row-failure="rowFailure" @hide="openHide" />

    <ConfirmDialog
      v-model:visible="isHideOpen"
      tone="danger"
      :title="$t('admin.posts.hide.title', { title: hidingPost?.title ?? '' })"
      :body="$t('admin.posts.hide.body')"
      :confirm-label="$t('admin.posts.hide.confirm')"
      :busy="isHiding"
      @confirm="confirmHide"
    />
  </div>
</template>
