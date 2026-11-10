<script setup lang="ts">
import { ChevronRight, EyeOff } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { voteComment } from '@/api/comments.api';
import type { VoteScore } from '@/api/types/votes';
import UserContent from '@/components/UserContent.vue';
import AppButton from '@/components/ui/AppButton.vue';
import Chip from '@/components/ui/Chip.vue';
import Notice from '@/components/ui/Notice.vue';
import RowMenu from '@/components/ui/RowMenu.vue';
import type { RowMenuItem } from '@/components/ui/RowMenu.vue';
import UserLink from '@/components/UserLink.vue';
import VoteControl from '@/components/VoteControl.vue';
import { signedScore } from '@/lib/format';
import { formatAgo, formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import type { NumberedComment } from './comment-order';
import { commentAnchor } from './comment-quote';
import type { CommentQuote } from './comment-quote';

/**
 * One comment of the flat list (layout C2): author, time, permalink and vote in the header; the quote of the comment it answers;
 * the body (or the edit form, the default slot, while `isEditing`); the actions. A folded comment (low score) is one line until shown.
 * Reply is the one visible action; the rest sit in a "more actions" menu (delete last, in red). Moderators also get hidden comments (a dashed, muted card with a
 * "hidden" badge naming who hid it, a line saying users no longer see it, and Unhide); a deleted comment stays as a placeholder
 * so the replies quoting it keep their context.
 */
const props = defineProps<{
  entry: NumberedComment;
  quote: CommentQuote | null;
  now: number;
  canVote: boolean;
  canReply: boolean;
  /** Shows "older than a year" where Reply would be. */
  isPastReplyWindow: boolean;
  moderates: boolean;
  /** Signed in and not the author: may report it (once; the backend says 409 after). */
  canReport: boolean;
  isEditing: boolean;
  /** Why the vote arrows are inert for this viewer (signed out, own comment); their tooltip. */
  voteDisabledReason?: string;
  /** The moderator's unhide of this comment failed: said under its actions. */
  unhideFailed?: boolean;
}>();
const emit = defineEmits<{
  reply: [];
  edit: [];
  history: [];
  hide: [];
  unhide: [];
  delete: [];
  report: [];
}>();
const { t } = useI18n();
const locale = useLocaleStore();
const comment = computed(() => props.entry.comment);
const anchor = computed(() => commentAnchor(comment.value.id));
const isExpanded = ref(false);
const isFolded = computed(
  () => comment.value.collapsed && !comment.value.deleted && !isExpanded.value && !props.isEditing,
);
const hiderName = computed(() => comment.value.hiddenBy?.username ?? null);
const authorName = computed(() => comment.value.author?.username ?? t('comments.deletedAccount'));
const send = (score: VoteScore) => voteComment(comment.value.id, score);

/** Edit, history (a deleted comment's only for moderators: its history holds the deleted text), report and the moderators' hide or unhide, then delete last. */
const menuItems = computed<RowMenuItem[]>(() => {
  const shown = comment.value;
  const items: RowMenuItem[] = [];
  if (shown.canEdit && !props.isEditing)
    items.push({ label: t('common.edit'), run: () => emit('edit') });
  if (shown.deleted ? props.moderates : shown.revisions)
    items.push({
      label: t('comments.action.history', { count: shown.revisions }),
      run: () => emit('history'),
    });
  if (props.canReport && !shown.deleted && !shown.hidden)
    items.push({ label: t('comments.action.report'), run: () => emit('report') });
  if (props.moderates)
    items.push(
      shown.hidden
        ? { label: t('comments.action.unhide'), run: () => emit('unhide') }
        : { label: t('common.hide'), run: () => emit('hide') },
    );
  if (shown.canDelete)
    items.push({ label: t('common.delete'), run: () => emit('delete'), danger: true });
  return items;
});
/** No row while editing (the form has its own buttons) or when there is nothing to offer. */
const hasActionRow = computed(
  () =>
    !props.isEditing &&
    ((!comment.value.deleted && (props.canReply || props.isPastReplyWindow)) ||
      menuItems.value.length > 0),
);
</script>

<template>
  <li :id="anchor" class="scroll-mt-24">
    <AppButton
      v-if="isFolded"
      tone="ghost"
      block
      :aria-expanded="false"
      class="justify-start border-dashed border-line text-left text-sm font-normal text-muted"
      @click="isExpanded = true"
    >
      <template #icon><ChevronRight aria-hidden="true" class="size-4 shrink-0" /></template>
      <span class="min-w-0 flex-1">
        {{
          quote?.number
            ? $t('comments.collapsedReply', {
                number: entry.number,
                author: authorName,
                parent: quote.number,
                score: signedScore(comment.score),
              })
            : $t('comments.collapsed', {
                number: entry.number,
                author: authorName,
                score: signedScore(comment.score),
              })
        }}
      </span>
      <span class="font-semibold text-accent-text">{{ $t('common.show') }}</span>
    </AppButton>
    <article
      v-else
      :aria-labelledby="`${anchor}-h`"
      :data-hidden="comment.hidden || undefined"
      class="rounded-card border border-line px-4 pt-3 pb-1 sm:px-5 sm:pt-4"
      :class="comment.hidden ? 'border-dashed bg-surface-strong' : 'bg-surface-solid'"
    >
      <p
        v-if="comment.hidden"
        data-testid="comment-hidden-notice"
        class="mb-2 flex items-center gap-2 text-sm text-muted"
      >
        <EyeOff aria-hidden="true" class="size-4 shrink-0" />
        {{ $t('comments.hidden.notice') }}
      </p>
      <header class="flex flex-wrap items-center gap-2">
        <span :id="`${anchor}-h`" class="flex min-w-0 flex-1 flex-wrap items-center gap-x-2">
          <UserLink
            v-if="comment.author"
            :username="comment.author.username"
            :rating="comment.author.rating"
            size="sm"
          />
          <span v-else class="font-semibold text-muted">{{ $t('comments.deletedAccount') }}</span>
          <time
            :datetime="comment.createdAt"
            :title="formatDate(comment.createdAt, 'datetime', locale.locale)"
            class="text-sm text-muted"
          >
            {{ formatAgo(comment.createdAt, now, locale.locale) }}
          </time>
          <AppButton
            v-if="comment.revisions && !comment.deleted"
            tone="link"
            class="text-caption leading-4 text-muted"
            :aria-label="$t('comments.editedLabel', { count: comment.revisions })"
            @click="emit('history')"
          >
            {{ $t('comments.edited') }}
          </AppButton>
          <span v-if="isEditing" class="text-sm text-muted"
            >· {{ $t('comments.composer.editing') }}</span
          >
          <template v-if="comment.hidden">
            <Chip data-testid="comment-hidden-badge" tone="warning">{{
              $t('comments.hidden.badge')
            }}</Chip>
            <span v-if="hiderName" class="text-sm text-muted">{{
              $t('comments.hidden.by', { name: hiderName })
            }}</span>
          </template>
          <a
            :href="`#${anchor}`"
            class="relative font-mono text-caption leading-4 text-muted hover:underline touch:after:absolute touch:after:-inset-3.5 touch:after:content-['']"
            :aria-label="$t('comments.permalink', { number: entry.number })"
          >
            #{{ entry.number }}
          </a>
        </span>
        <VoteControl
          orientation="row"
          class="-my-1 text-sm"
          :score="comment.score"
          :viewer-vote="comment.viewerVote"
          :can-vote="canVote && !comment.deleted && !comment.hidden"
          :disabled-reason="voteDisabledReason"
          :send="send"
        />
      </header>
      <a
        v-if="quote"
        :href="quote.href"
        data-testid="comment-quote"
        class="mt-1.5 mb-2 block rounded-row bg-surface-strong px-3 py-2 text-sm text-muted hover:bg-surface-hover hover:text-content"
      >
        <span class="font-semibold">
          {{
            quote.number
              ? $t('comments.replyTo', {
                  number: quote.number,
                  author: quote.author ?? $t('comments.deletedAccount'),
                })
              : $t('comments.replyToUnknown')
          }}
        </span>
        <template v-if="quote.isDeleted"> {{ $t('comments.deleted.quote') }}</template>
        <template v-else-if="quote.excerpt"> “{{ quote.excerpt }}”</template>
      </a>
      <slot v-if="isEditing" />
      <p
        v-else-if="comment.deleted"
        data-testid="comment-deleted"
        class="mt-1.5 mb-2 text-sm text-muted italic"
      >
        {{ $t('comments.deleted.placeholder') }}
      </p>
      <UserContent
        v-else
        :html="comment.bodyHtml"
        class="mt-1.5 mb-2"
        :class="comment.hidden && 'text-muted'"
      />
      <div v-if="hasActionRow" class="-ml-2.5 flex flex-wrap items-center gap-0.5 py-1">
        <AppButton
          v-if="canReply && !comment.deleted"
          tone="ghost"
          size="sm"
          @click="emit('reply')"
        >
          {{ $t('comments.action.reply') }}
        </AppButton>
        <span
          v-else-if="isPastReplyWindow && !comment.deleted"
          class="px-2.5 text-caption leading-4 text-muted"
        >
          {{ $t('comments.tooOld') }}
        </span>
        <RowMenu v-if="menuItems.length" :items="menuItems" :label="$t('common.moreActions')" />
      </div>
      <Notice v-if="unhideFailed" tone="danger" inline class="mb-2">
        {{ $t('comments.unhideFailed') }}
      </Notice>
    </article>
  </li>
</template>
