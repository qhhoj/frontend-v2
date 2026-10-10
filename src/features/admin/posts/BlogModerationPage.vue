<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { PostListItem } from '@/api/types/blog';
import SettingsNotice from '@/features/account/settings/SettingsNotice.vue';
import { adminRouteName } from '../admin-screens';
import AdminBit from '../shell/AdminBit.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import ModerationPostsQueue from './ModerationPostsQueue.vue';
import PublicPostsQueue from './PublicPostsQueue.vue';
import UnhideDialog from './UnhideDialog.vue';
import { visibilityFailureText } from './post-visibility';
import { usePostVisibility } from './use-post-visibility';
import { useModerationPostsQuery } from './posts.queries';
import { pageFromQuery } from '@/lib/paging';
import { MODERATION_FEEDS, feedFromQuery, isQueueFeed } from './moderation';
import type { ModerationFeed, RowFailure } from './moderation';

const route = useRoute();
const feed = computed(() => feedFromQuery(route.query.feed));
const page = computed(() => pageFromQuery(route.query.page));
const TABS: { feed: ModerationFeed; to: RouteLocationRaw }[] = MODERATION_FEEDS.map((tabFeed) => ({
  feed: tabFeed,
  to: { name: adminRouteName('posts'), query: tabFeed === 'all' ? {} : { feed: tabFeed } },
}));
const TAB =
  'inline-flex min-h-11 items-center gap-2 rounded-pill px-4 font-semibold hover:bg-surface-hover aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent-soft-text';
const feedNav = ref<HTMLElement | null>(null);

/** A moderated post leaves its row (the dialog's opener); the open feed's tab is the stable place left. A refused change keeps its row and the usual return. */
const focusCurrentFeed = () =>
  lastChange.value === null
    ? null
    : feedNav.value?.querySelector<HTMLElement>('[aria-current="page"]');

const visibility = usePostVisibility();
/** The hidden queue's total, on every tab: the same cache entry as the list when that tab is open. */
const hiddenQuery = useModerationPostsQuery('hidden', 1);
const hiddenTotal = computed(() => hiddenQuery.data.value?.meta.total ?? 0);

const hidingPost = ref<PostListItem | null>(null);
const unhidingPost = ref<PostListItem | null>(null);
const isHideOpen = ref(false);
const isUnhideOpen = ref(false);
const rowFailure = ref<RowFailure | null>(null);
const lastChange = ref<'hidden' | 'shown' | null>(null);
const unhideFailureText = computed(
  () => visibility.failure.value && visibilityFailureText(visibility.failure.value),
);

/** A new action starts with no leftover result, refusal or failure from the last one. */
function beginChange() {
  visibility.reset();
  rowFailure.value = null;
  lastChange.value = null;
}

function openHide(post: PostListItem) {
  beginChange();
  hidingPost.value = post;
  isHideOpen.value = true;
}

function openUnhide(post: PostListItem) {
  beginChange();
  unhidingPost.value = post;
  isUnhideOpen.value = true;
}

/** The dialog closes either way; a refusal stays on the row of the post it was for. */
async function confirmHide() {
  const post = hidingPost.value;
  if (post === null) return;
  const done = await visibility.hide(post);
  isHideOpen.value = false;
  if (done !== undefined) {
    lastChange.value = 'hidden';
    return;
  }
  rowFailure.value = visibility.failure.value && {
    postId: post.id,
    text: visibilityFailureText(visibility.failure.value),
  };
}

/** A refused show keeps the dialog open, with the reason in it. */
async function confirmUnhide() {
  const post = unhidingPost.value;
  if (post === null) return;
  const done = await visibility.show(post);
  if (done === undefined) return;
  isUnhideOpen.value = false;
  lastChange.value = 'shown';
}
</script>

<template>
  <div class="mx-auto flex max-w-[1280px] flex-col gap-6">
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
      <nav ref="feedNav" :aria-label="$t('admin.posts.feeds.label')">
        <div class="glass flex flex-wrap gap-1 rounded-pill p-1">
          <RouterLink
            v-for="tab in TABS"
            :key="tab.feed"
            v-slot="{ href, navigate }"
            custom
            :to="tab.to"
          >
            <a
              :href="href"
              :aria-current="feed === tab.feed ? 'page' : undefined"
              :class="TAB"
              @click="navigate"
            >
              {{ $t(`admin.posts.feeds.${tab.feed}`) }}
              <span
                v-if="tab.feed === 'hidden' && hiddenTotal > 0"
                data-testid="hidden-count"
                class="rounded-pill bg-surface-hover px-2 text-xs"
              >
                {{ hiddenTotal }}
              </span>
            </a>
          </RouterLink>
        </div>
      </nav>
      <p class="text-sm text-muted">{{ $t('admin.posts.feeds.note') }}</p>
    </div>

    <SettingsNotice v-if="feed === 'hidden'" tone="info">{{
      $t('admin.posts.hiddenNote')
    }}</SettingsNotice>
    <AdminStatus v-if="lastChange === 'hidden'" kind="done" :text="$t('admin.posts.hide.done')" />
    <AdminStatus v-if="lastChange === 'shown'" kind="done" :text="$t('admin.posts.unhide.done')" />
    <SettingsNotice tone="info">{{ $t('admin.posts.gap') }}</SettingsNotice>

    <ModerationPostsQueue
      v-if="isQueueFeed(feed)"
      :feed="feed"
      :page="page"
      :row-failure="rowFailure"
      :pending-post-id="visibility.pendingId.value"
      @hide="openHide"
      @show="openUnhide"
    />
    <PublicPostsQueue v-else :feed="feed" :page="page" :row-failure="rowFailure" @hide="openHide" />

    <ConfirmDialog
      v-model:visible="isHideOpen"
      :return-focus-to="focusCurrentFeed"
      tone="danger"
      :title="$t('admin.posts.hide.title', { title: hidingPost?.title ?? '' })"
      :body="$t('admin.posts.hide.body')"
      :confirm-label="$t('admin.posts.hide.confirm')"
      :busy="visibility.pendingId.value !== null"
      @confirm="confirmHide"
    />
    <UnhideDialog
      v-if="unhidingPost"
      v-model:visible="isUnhideOpen"
      :return-focus-to="focusCurrentFeed"
      :post="unhidingPost"
      :busy="visibility.pendingId.value === unhidingPost.id"
      :failure="unhideFailureText"
      @confirm="confirmUnhide"
    />
  </div>
</template>
