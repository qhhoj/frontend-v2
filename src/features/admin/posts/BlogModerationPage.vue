<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import type { LocationQueryRaw } from 'vue-router';
import type { PostListItem } from '@/api/types/blog';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { pageFromQuery } from '@/lib/paging';
import { adminRouteName } from '../admin-screens';
import AdminField from '../ui/AdminField.vue';
import AdminFilterTabs from '../ui/AdminFilterTabs.vue';
import type { AdminFilterTab } from '../ui/AdminFilterTabs.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import { INPUT, buttonClass } from '../ui/controls';
import AdminNotice from '../ui/feedback/AdminNotice.vue';
import { useAdminToast } from '../ui/feedback/use-admin-toast';
import AdminFilterBar from '../ui/table/AdminFilterBar.vue';
import ModerationPostsQueue from './ModerationPostsQueue.vue';
import PublicPostsQueue from './PublicPostsQueue.vue';
import UnhideDialog from './UnhideDialog.vue';
import { visibilityFailureText } from './post-visibility';
import { usePostVisibility } from './use-post-visibility';
import { useModerationPostsQuery } from './posts.queries';
import { MODERATION_FEEDS, feedFromQuery, isQueueFeed, searchFeedOf } from './moderation';
import type { ModerationFeed, PostFlags, RowFailure } from './moderation';
import { useBulkHidePosts } from './use-bulk-hide-posts';

const { t } = useI18n();
const toast = useAdminToast();
const route = useRoute();
const router = useRouter();
const feed = computed(() => feedFromQuery(route.query.feed));
const page = computed(() => pageFromQuery(route.query.page));
const textOf = (value: unknown) => (typeof value === 'string' ? value : '');
const search = computed(() => textOf(route.query.search));
const organization = computed(() => textOf(route.query.organization));

/** A search lands on a moderation queue (from a public feed: every post), first page. */
function showFound(text: string, slug: string) {
  const target: ModerationFeed = text || slug ? searchFeedOf(feed.value) : feed.value;
  const query: LocationQueryRaw = {
    ...(target === 'all' ? {} : { feed: target }),
    ...(text ? { search: text } : {}),
    ...(slug ? { organization: slug } : {}),
  };
  void router.push({ name: adminRouteName('posts'), query });
}
const searchModel = computed({
  get: () => search.value,
  set: (text: string) => showFound(text.trim(), organization.value),
});
const organizationText = ref(organization.value);
watch(organization, (value) => (organizationText.value = value));
const applyOrganization = () => {
  const slug = organizationText.value.trim();
  if (slug !== organization.value) showFound(search.value, slug);
};
const chips = computed(() =>
  organization.value
    ? [
        {
          key: 'organization',
          label: t('admin.posts.search.organizationSummary', { slug: organization.value }),
        },
      ]
    : [],
);

/** Ticked posts of the shown tab, hidden in one go; a new tab, page or search starts with none. */
const selected = ref(new Set<string>());
watch(
  () => route.query,
  () => (selected.value = new Set()),
);
const bulkHide = useBulkHidePosts();
const isBulkConfirmOpen = ref(false);
async function confirmBulkHide() {
  beginChange();
  try {
    const outcome = await bulkHide.run([...selected.value]);
    if (!outcome) return;
    toast.show({
      text: t('admin.posts.bulk.result', { ...outcome }),
      tone: outcome.refused ? 'error' : 'success',
    });
    selected.value = new Set();
  } finally {
    isBulkConfirmOpen.value = false;
  }
}
const feedNav = ref<HTMLElement | null>(null);

/** A moderated post leaves its row (the dialog's opener); the open feed's tab is the stable place left. A refused change keeps its row and the usual return. */
const focusCurrentFeed = () =>
  rowFailure.value === null
    ? feedNav.value?.querySelector<HTMLElement>('[aria-current="page"]')
    : null;

const visibility = usePostVisibility();
/** The hidden queue's total, on every tab: the same cache entry as the list when that tab is open. */
const hiddenQuery = useModerationPostsQuery('hidden', 1);
const hiddenTotal = computed(() => hiddenQuery.data.value?.meta.total ?? 0);
const feedTabs = computed<AdminFilterTab[]>(() =>
  MODERATION_FEEDS.map((tabFeed) => ({
    key: tabFeed,
    label: t(`admin.posts.feeds.${tabFeed}`),
    to: { name: adminRouteName('posts'), query: tabFeed === 'all' ? {} : { feed: tabFeed } },
    count: tabFeed === 'hidden' ? hiddenTotal.value : 0,
    countTestid: 'hidden-count',
  })),
);

const hidingPost = ref<PostListItem | null>(null);
const unhidingPost = ref<PostListItem | null>(null);
const isHideOpen = ref(false);
const isUnhideOpen = ref(false);
const rowFailure = ref<RowFailure | null>(null);
const unhideFailureText = computed(
  () => visibility.failure.value && visibilityFailureText(visibility.failure.value),
);

/** A new action starts with no leftover refusal or failure from the last one. */
function beginChange() {
  visibility.reset();
  rowFailure.value = null;
}
const keepRefusal = (post: PostListItem) =>
  (rowFailure.value = visibility.failure.value && {
    postId: post.id,
    text: visibilityFailureText(visibility.failure.value),
  });

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
  if (done === undefined) keepRefusal(post);
  isHideOpen.value = false;
  if (done !== undefined) toast.show({ text: t('admin.posts.hide.done') });
}

/** A pin or newsfeed change needs no confirm (it is undone the same way); a refusal stays on its row. */
async function changeFlag(post: PostListItem, patch: PostFlags) {
  beginChange();
  const done = await visibility.flag(post, patch);
  if (done === undefined) keepRefusal(post);
  else toast.show({ text: t('admin.posts.flagged') });
}

/** A refused show keeps the dialog open, with the reason in it. */
async function confirmUnhide() {
  const post = unhidingPost.value;
  if (post === null) return;
  const done = await visibility.show(post);
  if (done === undefined) return;
  isUnhideOpen.value = false;
  toast.show({ text: t('admin.posts.unhide.done') });
}
</script>

<template>
  <div class="flex w-full flex-col gap-4">
    <AdminPageHeader :title="$t('admin.posts.title')" :lead="$t('admin.posts.feeds.note')" />

    <AdminFilterBar
      v-model:search="searchModel"
      :search-label="$t('admin.posts.search.placeholder')"
      :chips="chips"
      :filter-count="organization ? 1 : 0"
      @remove="showFound(search, '')"
      @clear-all="showFound('', '')"
    >
      <template #view>
        <div ref="feedNav" class="min-w-0">
          <AdminFilterTabs
            :tabs="feedTabs"
            :current="feed"
            :label="$t('admin.posts.feeds.label')"
          />
        </div>
      </template>
      <template #filters>
        <form class="contents" @submit.prevent="applyOrganization">
          <AdminField :label="$t('admin.posts.search.organization')" input-id="posts-organization">
            <input
              id="posts-organization"
              v-model="organizationText"
              type="search"
              autocomplete="off"
              spellcheck="false"
              :class="[INPUT, 'font-mono']"
              :placeholder="$t('admin.posts.search.organizationPlaceholder')"
              @change="applyOrganization"
            />
          </AdminField>
        </form>
      </template>
    </AdminFilterBar>
    <p v-if="search && isQueueFeed(feed)" class="text-sm text-muted" data-testid="search-summary">
      {{ $t('admin.posts.search.summary', { text: search }) }}
    </p>

    <AdminNotice v-if="feed === 'hidden'" :title="$t('admin.posts.hiddenNote')" />

    <ModerationPostsQueue
      v-if="isQueueFeed(feed)"
      v-model:selected="selected"
      :feed="feed"
      :page="page"
      :search="search"
      :organization="organization"
      :row-failure="rowFailure"
      :pending-post-id="visibility.pendingId.value"
      :selectable="feed !== 'hidden'"
      @hide="openHide"
      @show="openUnhide"
      @flag="changeFlag"
    >
      <template #bulk>
        <button
          type="button"
          :class="buttonClass('secondary', 'sm')"
          :aria-disabled="bulkHide.isPending.value || undefined"
          @click="bulkHide.isPending.value || (isBulkConfirmOpen = true)"
        >
          {{ $t('admin.posts.bulk.hide') }}
        </button>
      </template>
    </ModerationPostsQueue>
    <PublicPostsQueue
      v-else
      v-model:selected="selected"
      :feed="feed"
      :page="page"
      :row-failure="rowFailure"
      :pending-post-id="visibility.pendingId.value"
      selectable
      @hide="openHide"
      @flag="changeFlag"
    >
      <template #bulk>
        <button
          type="button"
          :class="buttonClass('secondary', 'sm')"
          :aria-disabled="bulkHide.isPending.value || undefined"
          @click="bulkHide.isPending.value || (isBulkConfirmOpen = true)"
        >
          {{ $t('admin.posts.bulk.hide') }}
        </button>
      </template>
    </PublicPostsQueue>

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
    <ConfirmDialog
      v-model:visible="isBulkConfirmOpen"
      tone="danger"
      :title="$t('admin.posts.bulk.confirmTitle', { count: selected.size }, selected.size)"
      :body="$t('admin.posts.bulk.confirmBody')"
      :confirm-label="$t('admin.posts.bulk.hide')"
      :busy="bulkHide.isPending.value"
      @confirm="confirmBulkHide"
    />
  </div>
</template>
