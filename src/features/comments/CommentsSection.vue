<script setup lang="ts">
import { ChevronDown, Lock, LockOpen } from 'lucide-vue-next';
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import type { CommentPageType } from '@/api/types/comments';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import AppButton from '@/components/ui/AppButton.vue';
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
import CommentReportDialog from './CommentReportDialog.vue';
import CommentRevisionsDialog from './CommentRevisionsDialog.vue';
import { commentFailureOf } from './comment-failure';
import type { CommentFailure } from './comment-failure';
import { flattenInTimeOrder } from './comment-order';
import type { NumberedComment } from './comment-order';
import { quoteOf } from './comment-quote';
import { canReplyTo, composerStateOf } from './composer-state';
import { useCommentPageQuery, useCommentWrites } from './comments.queries';
import { useCommentJump } from './use-comment-jump';

/**
 * The comments of one page, layout C2 ("flat, with quotes"): one list in time order, a reply quoting the comment it answers,
 * the composer (or why there is none, from the backend's `postBlock`) below; delete, report, and moderators' lock, hide and unhide
 * (moderators also get the hidden comments). `contestKey` links the announcements of the viewer's running contest.
 */
const props = withDefaults(
  defineProps<{
    type: CommentPageType;
    pageKey: string;
    contestKey?: string | null;
    placeholderKey?: string;
    /** P-02: a page without comments shows one "Bình luận (0)" row that opens the section (the problem page). */
    foldWhenEmpty?: boolean;
  }>(),
  { contestKey: null, placeholderKey: undefined, foldWhenEmpty: false },
);
const PAGE_QUERY = 'commentPage';
const MODERATE_PERMISSION = 'judge.change_comment';

const route = useRoute();
const { t } = useI18n();
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
const isContestHidden = computed(() => data.value?.postBlock?.reason === 'contest');
const composerState = computed(() => data.value && composerStateOf(isSignedIn.value, data.value));

const entries = computed(() => flattenInTimeOrder(data.value?.comments ?? []));
const isUnfolded = ref(false);
const isFolded = computed(
  () =>
    props.foldWhenEmpty &&
    !isUnfolded.value &&
    data.value !== undefined &&
    data.value.pagination.page === 1 &&
    entries.value.length === 0 &&
    // A gate or a lock is news in itself: it stays in sight.
    !isContestHidden.value &&
    !data.value.pageLocked,
);
const heading = ref<HTMLElement | null>(null);
/** Opening the folded row puts focus on the section's heading, where the row was. */
async function unfold() {
  isUnfolded.value = true;
  await nextTick();
  heading.value?.focus();
}
const byId = computed(() => new Map(entries.value.map((entry) => [entry.comment.id, entry])));
const quoteFor = (entry: NumberedComment) =>
  entry.comment.parentId ? quoteOf(entry.comment.parentId, byId.value) : null;
const lastPage = computed(() => (data.value ? lastPageOf(data.value.pagination) : 1));
const canReplyToEntry = (entry: NumberedComment) =>
  canReplyTo(entry.comment.createdAt, now.value, moderates.value);
const authorOf = (entry: NumberedComment | null) =>
  entry?.comment.author?.username ?? t('comments.deletedAccount');

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
    await writes.setLocked.mutateAsync(!data.value.pageLocked);
  } catch {
    lockFailed.value = true;
  }
}

const unhideFailedId = ref<string | null>(null);
async function unhide(entry: NumberedComment) {
  unhideFailedId.value = null;
  try {
    await writes.unhide.mutateAsync(entry.comment.id);
  } catch {
    unhideFailedId.value = entry.comment.id;
  }
}

// Delete (the author, or a moderator): a confirm, then the placeholder.
const deleteTarget = ref<NumberedComment | null>(null);
const isDeleteOpen = ref(false);
const deleteFailed = ref(false);
function askDelete(entry: NumberedComment) {
  deleteTarget.value = entry;
  deleteFailed.value = false;
  isDeleteOpen.value = true;
}
async function confirmDelete() {
  if (!deleteTarget.value) return;
  try {
    await writes.remove.mutateAsync(deleteTarget.value.comment.id);
    isDeleteOpen.value = false;
  } catch {
    deleteFailed.value = true;
  }
}

// Report: a dialog, then a thank-you line.
const reportTarget = ref<NumberedComment | null>(null);
const isReportOpen = ref(false);
const reportSent = ref(false);
function askReport(entry: NumberedComment) {
  reportTarget.value = entry;
  reportSent.value = false;
  isReportOpen.value = true;
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

useCommentJump({
  type: () => props.type,
  pageKey: () => props.pageKey,
  pageNumber: () => pageNumber.value,
  pageQuery: PAGE_QUERY,
  shownIds: () => (data.value ? new Set(byId.value.keys()) : null),
});
</script>

<template>
  <section
    v-if="!isUnreadable"
    id="comments"
    aria-labelledby="comments-heading"
    class="flex scroll-mt-20 flex-col gap-4"
  >
    <h2 v-if="isFolded" id="comments-heading">
      <button
        type="button"
        data-testid="comments-fold"
        aria-expanded="false"
        class="flex min-h-11 w-full items-center gap-2 rounded-card border border-line bg-surface-solid px-5 py-3 text-left hover:bg-surface-hover"
        @click="unfold"
      >
        <span class="font-display text-base font-semibold">{{ $t('comments.title') }}</span>
        <span class="font-mono text-sm text-muted">(0)</span>
        <ChevronDown aria-hidden="true" class="ml-auto size-5 text-muted" />
      </button>
    </h2>
    <template v-else>
      <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2
          id="comments-heading"
          ref="heading"
          tabindex="-1"
          class="font-display text-section leading-7 font-semibold outline-none sm:text-display sm:leading-8"
        >
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
        <AppButton
          v-if="data && moderates && !isContestHidden"
          size="sm"
          class="ml-auto self-center"
          :aria-pressed="data.pageLocked"
          :loading="writes.setLocked.isPending.value"
          @click="toggleLock"
        >
          <template #icon>
            <component :is="data.pageLocked ? LockOpen : Lock" aria-hidden="true" class="size-4" />
          </template>
          {{ $t(data.pageLocked ? 'comments.action.unlock' : 'comments.action.lock') }}
        </AppButton>
      </div>
      <p
        v-if="data && moderates && data.pageLocked && !isContestHidden"
        role="status"
        class="flex items-center gap-2.5 rounded-card border border-line bg-surface-strong px-4 py-3 text-sm"
      >
        <Lock aria-hidden="true" class="size-5 shrink-0" />
        <span>
          <strong>{{ $t('comments.moderation.lockedTitle') }}</strong>
          {{
            $t(
              data.canComment
                ? 'comments.moderation.lockedOverride'
                : 'comments.moderation.lockedBody',
            )
          }}
        </span>
      </p>
      <p v-if="reportSent" role="status" class="text-sm text-muted">
        {{ $t('comments.report.sent') }}
      </p>
      <p v-if="unhideFailedId" role="alert" class="text-sm text-negative">
        {{ $t('comments.unhideFailed') }}
      </p>
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
                :can-report="isSignedIn && entry.comment.author?.id !== session.user?.id"
                :is-editing="editingId === entry.comment.id"
                :is-phone="isPhone"
                @reply="startReply(entry)"
                @edit="startEdit(entry)"
                @history="showHistory(entry)"
                @hide="askHide(entry)"
                @unhide="unhide(entry)"
                @delete="askDelete(entry)"
                @report="askReport(entry)"
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
            <p v-if="data.truncatedThreads.length" class="text-sm text-muted">
              {{ $t('comments.truncatedReplies') }}
            </p>
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
            <CommentGate
              v-else-if="composerState"
              :reason="composerState"
              :contest-key="contestKey"
              :solved="data.postBlock?.solved"
              :required="data.postBlock?.required"
              class="mt-2"
            />
          </template>
        </template>
      </QueryState>
    </template>

    <ConfirmDialog
      v-model:visible="isHideOpen"
      tone="danger"
      :title="
        $t('comments.hide.title', {
          author: authorOf(hideTarget),
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
    <ConfirmDialog
      v-model:visible="isDeleteOpen"
      tone="danger"
      :title="$t('comments.delete.title', { number: deleteTarget?.number ?? '' })"
      :body="$t('comments.delete.body')"
      :confirm-label="$t('comments.delete.confirm')"
      :busy="writes.remove.isPending.value"
      @confirm="confirmDelete"
    >
      <template #error>
        <p v-if="deleteFailed" role="alert" class="text-sm text-negative">
          {{ $t('comments.delete.failed') }}
        </p>
      </template>
    </ConfirmDialog>
    <CommentReportDialog
      v-if="reportTarget"
      v-model:visible="isReportOpen"
      :comment-id="reportTarget.comment.id"
      :author="authorOf(reportTarget)"
      @sent="reportSent = true"
    />
    <CommentRevisionsDialog
      v-if="historyId"
      v-model:visible="isHistoryOpen"
      :comment-id="historyId"
    />
  </section>
</template>
