<script setup lang="ts">
import { ChevronRight, MoreHorizontal } from 'lucide-vue-next';
import Menu from 'primevue/menu';
import type { MenuItem } from 'primevue/menuitem';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { voteComment } from '@/api/comments.api';
import type { VoteScore } from '@/api/types/votes';
import UserContent from '@/components/UserContent.vue';
import UserName from '@/components/UserName.vue';
import VoteControl from '@/components/VoteControl.vue';
import { formatAgo, formatNumericDateTime, signedScore } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import type { NumberedComment } from './comment-order';
import { commentAnchor } from './comment-quote';
import type { CommentQuote } from './comment-quote';

/**
 * One comment of the flat list (layout C2): author, time, permalink and vote in the header; the quote of the comment it answers;
 * the body (or the edit form, the default slot, while `isEditing`); the actions. A folded comment (low score) is one line until shown.
 * On a phone the actions past Reply move into a "more" menu.
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
  isEditing: boolean;
  isPhone: boolean;
}>();
const emit = defineEmits<{ reply: []; edit: []; history: []; hide: [] }>();
const { t } = useI18n();
const locale = useLocaleStore();
const comment = computed(() => props.entry.comment);
const anchor = computed(() => commentAnchor(comment.value.id));
const isExpanded = ref(false);
const isFolded = computed(() => comment.value.collapsed && !isExpanded.value && !props.isEditing);
const authorName = computed(() => comment.value.author?.username ?? t('comments.deletedAccount'));
const send = (score: VoteScore) => voteComment(comment.value.id, score);

interface Action {
  id: string;
  label: string;
  run: () => void;
  isModeration?: boolean;
}
const actions = computed<Action[]>(() => [
  ...(comment.value.canEdit && !props.isEditing
    ? [{ id: 'edit', label: t('comments.action.edit'), run: () => emit('edit') }]
    : []),
  ...(comment.value.revisions
    ? [
        {
          id: 'history',
          label: t('comments.action.history', { count: comment.value.revisions }),
          run: () => emit('history'),
        },
      ]
    : []),
  ...(props.moderates
    ? [
        {
          id: 'hide',
          label: t('comments.action.hide'),
          run: () => emit('hide'),
          isModeration: true,
        },
      ]
    : []),
]);
/** No row while editing (the form has its own buttons) or when there is nothing to offer. */
const hasActionRow = computed(
  () => !props.isEditing && (props.canReply || props.isPastReplyWindow || actions.value.length > 0),
);
const menu = ref<InstanceType<typeof Menu>>();
const isMenuOpen = ref(false);
const menuModel = computed<MenuItem[]>(() =>
  actions.value.map((action) => ({ label: action.label, command: action.run })),
);
const TEXT_BUTTON =
  'inline-flex min-h-11 items-center rounded-row px-2.5 text-sm text-muted hover:bg-surface-hover hover:text-content';
</script>

<template>
  <li :id="anchor" class="scroll-mt-24">
    <button
      v-if="isFolded"
      type="button"
      :aria-expanded="false"
      class="flex min-h-11 w-full items-center gap-2 rounded-card border border-dashed border-line px-4 py-3 text-left text-sm text-muted hover:bg-surface-hover sm:px-5"
      @click="isExpanded = true"
    >
      <ChevronRight aria-hidden="true" class="size-4 shrink-0" />
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
      <span class="font-semibold text-accent-text">{{ $t('comments.show') }}</span>
    </button>
    <article
      v-else
      :aria-labelledby="`${anchor}-h`"
      class="rounded-card border border-line bg-surface-solid px-4 pt-3 pb-1 sm:px-5 sm:pt-4"
    >
      <header class="flex flex-wrap items-center gap-2">
        <span :id="`${anchor}-h`" class="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
          <UserName
            v-if="comment.author"
            :username="comment.author.username"
            :rating="comment.author.rating"
          />
          <span v-else class="font-semibold text-muted">{{ $t('comments.deletedAccount') }}</span>
          <time
            :datetime="comment.createdAt"
            :title="formatNumericDateTime(comment.createdAt, locale.locale)"
            class="text-sm text-muted"
          >
            {{ formatAgo(comment.createdAt, now, locale.locale) }}
          </time>
          <button
            v-if="comment.revisions"
            type="button"
            class="text-xs text-muted underline decoration-dotted hover:text-content"
            :aria-label="$t('comments.editedLabel', { count: comment.revisions })"
            @click="emit('history')"
          >
            {{ $t('comments.edited') }}
          </button>
          <span v-if="isEditing" class="text-sm text-muted"
            >· {{ $t('comments.composer.editing') }}</span
          >
          <a
            :href="`#${anchor}`"
            class="font-mono text-xs text-muted hover:underline"
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
          :can-vote="canVote"
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
        <template v-if="quote.excerpt"> “{{ quote.excerpt }}”</template>
      </a>
      <slot v-if="isEditing" />
      <UserContent v-else :html="comment.bodyHtml" class="mt-1.5 mb-2" />
      <div v-if="hasActionRow" class="-ml-2.5 flex flex-wrap items-center gap-0.5 py-1">
        <button v-if="canReply" type="button" :class="TEXT_BUTTON" @click="emit('reply')">
          {{ $t('comments.action.reply') }}
        </button>
        <span v-else-if="isPastReplyWindow" class="px-2.5 text-xs text-muted">
          {{ $t('comments.tooOld') }}
        </span>
        <template v-if="isPhone && actions.length">
          <button
            type="button"
            :class="TEXT_BUTTON"
            :aria-label="$t('comments.action.more')"
            aria-haspopup="menu"
            :aria-expanded="isMenuOpen"
            @click="menu?.toggle($event)"
          >
            <MoreHorizontal aria-hidden="true" class="size-4" />
          </button>
          <Menu
            ref="menu"
            :model="menuModel"
            popup
            :pt="{ root: { 'aria-label': $t('comments.action.more') } }"
            @show="isMenuOpen = true"
            @hide="isMenuOpen = false"
          />
        </template>
        <template v-else>
          <template v-for="action in actions" :key="action.id">
            <span v-if="action.isModeration" aria-hidden="true" class="mx-1 h-5 w-px bg-line" />
            <button
              type="button"
              :class="[TEXT_BUTTON, action.isModeration && 'font-semibold text-accent-text']"
              @click="action.run"
            >
              {{ action.label }}
            </button>
          </template>
        </template>
      </div>
    </article>
  </li>
</template>
