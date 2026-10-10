<script setup lang="ts">
import { Lock, LockOpen } from 'lucide-vue-next';
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import type { CommentPageType } from '@/api/types/comments';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import EmptyState from '@/components/EmptyState.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { lastPageOf, pageFromQuery } from '@/lib/paging';
import { hasPermission } from '@/lib/permissions';
import { useNow } from '@/lib/use-now';
import { PHONE_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { useSessionStore } from '@/stores/session.store';
import CommentComposer from './CommentComposer.vue';
import CommentGate from './CommentGate.vue';
import CommentItem from './CommentItem.vue';
import CommentRevisionsDialog from './CommentRevisionsDialog.vue';
import { commentFailureOf } from './comment-failure';
import type { CommentFailure } from './comment-failure';
import { flattenInTimeOrder } from './comment-order';
import type { NumberedComment } from './comment-order';
import { commentAnchor, quoteOf } from './comment-quote';
import { canReplyTo, composerStateOf } from './composer-state';
import { useCommentPageQuery, useCommentWrites } from './comments.queries';

/**
 * The comments of one page, layout C2 ("flat, with quotes"): one list in time order, a reply quoting the comment it answers,
 * the composer (or why there is none) below, moderators' lock and hide. `contestKey`: the viewer's running contest holds this
 * problem, so a locked answer means the backend hid the thread from a contestant.
 */
const props = withDefaults(
  defineProps<{
    type: CommentPageType;
    pageKey: string;
    contestKey?: string | null;
    placeholderKey?: string;
  }>(),
  { contestKey: null, placeholderKey: undefined },
);
const PAGE_QUERY = 'commentPage';
const MODERATE_PERMISSION = 'judge.change_comment';

const route = useRoute();
const session = useSessionStore();
const isPhone = useMediaQuery(PHONE_QUERY);
const now = useNow(60_000);
const pageNumber = computed(() => pageFromQuery(route.query[PAGE_QUERY]));
const { data, isPending, error, refetch } = useCommentPageQuery(
  () => props.type,
  () => props.pageKey,
  pageNumber,
);
const writes = useCommentWrites(
  () => props.type,
  () => props.pageKey,
);

const isSignedIn = computed(() => session.user !== null);
const moderates = computed(() => hasPermission(session.user, MODERATE_PERMISSION));
const isOfficialClosed = computed(
  () => error.value instanceof ApiError && error.value.code === 'forbidden',
);
const isUnreadable = computed(() => error.value instanceof ApiError && error.value.status === 404);
const isContestHidden = computed(() => Boolean(props.contestKey && data.value?.locked));
const composerState = computed(() => data.value && composerStateOf(isSignedIn.value, data.value));

const entries = computed(() => flattenInTimeOrder(data.value?.comments ?? []));
const byId = computed(() => new Map(entries.value.map((entry) => [entry.comment.id, entry])));
const quoteFor = (entry: NumberedComment) =>
  entry.comment.parentId ? quoteOf(entry.comment.parentId, byId.value) : null;
const lastPage = computed(() => (data.value ? lastPageOf(data.value.pagination) : 1));
const canReplyToEntry = (entry: NumberedComment) =>
  canReplyTo(entry.comment.createdAt, now.value, moderates.value);

// The composer: a new comment or a reply.
const composer = ref<{ focus: () => Promise<void> } | null>(null);
const draft = ref('');
const replyToId = ref<string | null>(null);
const replyQuote = computed(() => replyToId.value && quoteOf(replyToId.value, byId.value));
const postFailure = ref<CommentFailure | null>(null);
function startReply(entry: NumberedComment) {
  replyToId.value = entry.comment.id;
  postFailure.value = null;
  void composer.value?.focus();
}
async function sendComment() {
  postFailure.value = null;
  try {
    await writes.post.mutateAsync({
      body: draft.value,
      ...(replyToId.value ? { parentId: replyToId.value } : {}),
    });
    draft.value = '';
    replyToId.value = null;
  } catch (failure) {
    postFailure.value = commentFailureOf(failure);
    if (postFailure.value.refreshesPage) void writes.refresh();
  }
}

// Editing one comment in place.
const editingId = ref<string | null>(null);
const editDraft = ref('');
const editFailure = ref<CommentFailure | null>(null);
function startEdit(entry: NumberedComment) {
  editingId.value = entry.comment.id;
  editDraft.value = entry.comment.body ?? '';
  editFailure.value = null;
}
async function saveEdit() {
  if (!editingId.value) return;
  editFailure.value = null;
  try {
    await writes.edit.mutateAsync({ id: editingId.value, body: editDraft.value });
    editingId.value = null;
  } catch (failure) {
    editFailure.value = commentFailureOf(failure);
  }
}
/** After a 409 the page is fetched again; the typed text stays, the failure line goes. */
async function reloadAfterConflict() {
  await writes.refresh(editingId.value ?? undefined);
  editFailure.value = null;
}

// Moderation: hide one comment (with its replies), lock or unlock the page.
const hideTarget = ref<NumberedComment | null>(null);
const isHideOpen = ref(false);
const hideFailed = ref(false);
function askHide(entry: NumberedComment) {
  hideTarget.value = entry;
  hideFailed.value = false;
  isHideOpen.value = true;
}
async function confirmHide() {
  if (!hideTarget.value) return;
  try {
    await writes.hide.mutateAsync(hideTarget.value.comment.id);
    isHideOpen.value = false;
  } catch {
    hideFailed.value = true;
  }
}
const lockFailed = ref(false);
async function toggleLock() {
  if (!data.value) return;
  lockFailed.value = false;
  try {
    await writes.setLocked.mutateAsync(!data.value.locked);
  } catch {
    lockFailed.value = true;
  }
}

const historyId = ref<string | null>(null);
const isHistoryOpen = ref(false);
function showHistory(entry: NumberedComment) {
  historyId.value = entry.comment.id;
  isHistoryOpen.value = true;
}

// Another page (or another problem or post) starts clean.
watch(
  () => [props.type, props.pageKey],
  () => {
    draft.value = '';
    replyToId.value = null;
    editingId.value = null;
    postFailure.value = null;
  },
);

/** A `#comment-<id>` link scrolls once the list holding it has rendered (the router's own scroll runs before the fetch ends). */
watch(
  () => [data.value, route.hash] as const,
  async ([loaded, hash]) => {
    if (!loaded || !hash.startsWith(`#${commentAnchor('')}`)) return;
    await nextTick();
    document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
  },
  { immediate: true },
);
</script>

<template>
  <section
    v-if="!isUnreadable"
    id="comments"
    aria-labelledby="comments-heading"
    class="flex scroll-mt-20 flex-col gap-4"
  >
    <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h2 id="comments-heading" class="font-display text-xl font-semibold sm:text-2xl">
        {{ $t('comments.title') }}
      </h2>
      <span v-if="data && !isContestHidden && entries.length" class="text-sm text-muted">
        {{
          lastPage > 1
            ? $t('comments.pageOf', { page: data.pagination.page, last: lastPage })
            : $t('comments.count', { count: entries.length }, entries.length)
        }}
        · {{ $t('comments.timeOrder') }}
      </span>
      <button
        v-if="data && moderates && !isContestHidden"
        type="button"
        class="ml-auto inline-flex min-h-10 items-center gap-1.5 self-center rounded-pill border border-line px-3.5 text-sm font-semibold text-accent-text hover:bg-surface-hover"
        :aria-pressed="data.locked"
        :aria-busy="writes.setLocked.isPending.value || undefined"
        @click="toggleLock"
      >
        <component :is="data.locked ? LockOpen : Lock" aria-hidden="true" class="size-4" />
        {{ $t(data.locked ? 'comments.action.unlock' : 'comments.action.lock') }}
      </button>
    </div>
    <p v-if="lockFailed" role="alert" class="text-sm text-negative">
      {{ $t('comments.lockFailed') }}
    </p>

    <CommentGate v-if="isOfficialClosed" reason="official" />
    <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <div class="flex flex-col gap-3" aria-hidden="true">
          <SkeletonBlock v-for="row in 3" :key="row" class="block h-24 w-full" />
        </div>
      </template>
      <template v-if="data">
        <CommentGate v-if="isContestHidden" reason="contest" :contest-key="contestKey" />
        <template v-else>
          <ol v-if="entries.length" class="flex flex-col gap-3">
            <CommentItem
              v-for="entry in entries"
              :key="entry.comment.id"
              :entry="entry"
              :quote="quoteFor(entry)"
              :now="now"
              :can-vote="isSignedIn && entry.comment.author?.id !== session.user?.id"
              :can-reply="composerState === 'ready' && canReplyToEntry(entry)"
              :is-past-reply-window="composerState === 'ready' && !canReplyToEntry(entry)"
              :moderates="moderates"
              :is-editing="editingId === entry.comment.id"
              :is-phone="isPhone"
              @reply="startReply(entry)"
              @edit="startEdit(entry)"
              @history="showHistory(entry)"
              @hide="askHide(entry)"
            >
              <CommentComposer
                v-model="editDraft"
                mode="edit"
                :busy="writes.edit.isPending.value"
                :failure="editFailure"
                @submit="saveEdit"
                @cancel="editingId = null"
                @reload="reloadAfterConflict"
              />
            </CommentItem>
          </ol>
          <div
            v-else
            data-testid="comments-empty"
            class="rounded-card border border-line bg-surface-solid"
          >
            <EmptyState>
              <span class="block font-display font-semibold text-content">
                {{ $t('comments.empty') }}
              </span>
              <span v-if="composerState === 'ready'" class="mt-1 block text-sm">
                {{ $t('comments.emptyBody') }}
              </span>
            </EmptyState>
          </div>
          <NumberedPager
            :meta="data.pagination"
            :label="$t('comments.pager')"
            :query-key="PAGE_QUERY"
          />
          <CommentComposer
            v-if="composerState === 'ready'"
            ref="composer"
            v-model="draft"
            mode="new"
            class="mt-2"
            :reply-to="replyQuote || null"
            :busy="writes.post.isPending.value"
            :failure="postFailure"
            :placeholder-key="placeholderKey"
            :start-collapsed="isPhone"
            @submit="sendComment"
            @cancel-reply="replyToId = null"
          />
          <CommentGate v-else-if="composerState" :reason="composerState" class="mt-2" />
        </template>
      </template>
    </QueryState>

    <ConfirmDialog
      v-model:visible="isHideOpen"
      tone="danger"
      :title="
        $t('comments.hide.title', {
          author: hideTarget?.comment.author?.username ?? $t('comments.deletedAccount'),
        })
      "
      :body="$t('comments.hide.body')"
      :confirm-label="$t('comments.hide.confirm')"
      :busy="writes.hide.isPending.value"
      @confirm="confirmHide"
    >
      <template #error>
        <p v-if="hideFailed" role="alert" class="text-sm text-negative">
          {{ $t('comments.hide.failed') }}
        </p>
      </template>
    </ConfirmDialog>
    <CommentRevisionsDialog
      v-if="historyId"
      v-model:visible="isHistoryOpen"
      :comment-id="historyId"
    />
  </section>
</template>
