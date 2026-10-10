<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next';
import { computed, nextTick, ref, useId, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { COMMENT_MAX_LENGTH } from '@/api/types/comments';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import CommentPreview from './CommentPreview.vue';
import type { CommentFailure } from './comment-failure';
import type { CommentQuote } from './comment-quote';

/**
 * The comment form: a new comment (optionally a reply, with a banner naming the comment it answers) or an edit. The draft is
 * the caller's (`v-model`), so a refused send keeps it. `startCollapsed` (phone) shows one "Write a comment…" button until tapped.
 * "Write" and "Preview" tabs: the preview is the backend's rendering, fetched only while its tab is open.
 */
const props = withDefaults(
  defineProps<{
    mode: 'new' | 'edit';
    replyTo?: CommentQuote | null;
    busy: boolean;
    failure: CommentFailure | null;
    placeholderKey?: string;
    startCollapsed?: boolean;
  }>(),
  {
    replyTo: null,
    placeholderKey: 'comments.composer.placeholder',
    startCollapsed: false,
  },
);
const text = defineModel<string>({ required: true });
const emit = defineEmits<{ submit: []; cancel: []; cancelReply: []; reload: [] }>();
const { t } = useI18n();
const locale = useLocaleStore();
const id = useId();
const textarea = ref<HTMLTextAreaElement | null>(null);
const isOpen = ref(!props.startCollapsed);
type ComposerTab = 'write' | 'preview';
const TABS: readonly ComposerTab[] = ['write', 'preview'];
const tab = ref<ComposerTab>('write');
const tabButtons = ref<HTMLButtonElement[]>([]);
// A sent (cleared) draft starts over in the text.
watch(text, (value) => {
  if (value === '') tab.value = 'write';
});
function switchWithArrow(event: KeyboardEvent) {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  tab.value = tab.value === 'write' ? 'preview' : 'write';
  tabButtons.value[TABS.indexOf(tab.value)]?.focus();
}
const isExpanded = computed(() => isOpen.value || props.replyTo !== null || text.value !== '');
const isBlank = computed(() => !/\S/.test(text.value));
const isTooLong = computed(() => text.value.length > COMMENT_MAX_LENGTH);
/** "#5 minhkhoa_hsgqg": the number only when the parent is on this page. */
const replyTarget = computed(() => {
  const quote = props.replyTo;
  if (!quote) return '';
  const author = quote.author ?? t('comments.deletedAccount');
  return quote.number ? `#${quote.number} ${author}` : author;
});
const cannotSend = computed(() => props.busy || isBlank.value || isTooLong.value);
const submitKey = computed(() => {
  if (props.mode === 'edit')
    return props.busy ? 'comments.composer.saving' : 'comments.composer.save';
  if (props.busy) return 'comments.composer.sending';
  return props.replyTo ? 'comments.composer.sendReply' : 'comments.composer.send';
});

/** Opens (on a phone) and puts the caret in the text: Reply and the collapsed button land here. */
async function focus() {
  isOpen.value = true;
  tab.value = 'write';
  await nextTick();
  textarea.value?.scrollIntoView({ block: 'center' });
  textarea.value?.focus();
}
defineExpose({ focus });

function submit() {
  if (!cannotSend.value) emit('submit');
}
const SECONDARY =
  'inline-flex min-h-10 items-center rounded-pill border border-line px-4 text-sm font-semibold hover:bg-surface-hover';
</script>

<template>
  <button
    v-if="!isExpanded"
    type="button"
    data-testid="composer-open"
    class="flex min-h-12 w-full items-center rounded-card border border-line bg-surface-solid px-4 text-left text-muted hover:bg-surface-hover"
    @click="focus"
  >
    {{ $t('comments.composer.open') }}
  </button>
  <form
    v-else
    :aria-label="$t(mode === 'edit' ? 'comments.composer.editLabel' : 'comments.composer.label')"
    :class="mode === 'new' && 'rounded-card border border-line bg-surface-solid'"
    @submit.prevent="submit"
  >
    <div
      v-if="replyTo"
      class="flex flex-wrap items-center gap-2.5 rounded-t-card bg-surface-strong px-4 py-1.5 text-sm"
    >
      <span class="min-w-0 flex-1">
        {{ $t('comments.composer.replyingTo') }}
        <a :href="replyTo.href" class="font-semibold text-accent-text hover:underline">
          {{ replyTarget }}
        </a>
      </span>
      <button
        type="button"
        class="inline-flex min-h-10 items-center rounded-row px-2.5 text-muted hover:bg-surface-hover hover:text-content"
        @click="emit('cancelReply')"
      >
        {{ $t('comments.composer.cancelReply') }}
      </button>
    </div>
    <div :class="mode === 'new' ? 'px-4 pt-3.5' : 'pt-2'">
      <div role="tablist" :aria-label="$t('comments.composer.views')" class="mb-2 flex gap-1">
        <button
          v-for="name in TABS"
          :id="`${id}-tab-${name}`"
          ref="tabButtons"
          :key="name"
          type="button"
          role="tab"
          :aria-selected="tab === name"
          :aria-controls="`${id}-panel-${name}`"
          :tabindex="tab === name ? 0 : -1"
          class="min-h-10 rounded-pill px-3.5 text-sm"
          :class="
            tab === name
              ? 'bg-accent-soft font-semibold text-accent-soft-text'
              : 'text-muted hover:bg-surface-hover'
          "
          @click="tab = name"
          @keydown="switchWithArrow"
        >
          {{ $t(`comments.composer.tab.${name}`) }}
        </button>
      </div>
      <div
        v-show="tab === 'write'"
        :id="`${id}-panel-write`"
        role="tabpanel"
        :aria-labelledby="`${id}-tab-write`"
      >
        <label :for="id" class="sr-only">{{ $t('comments.composer.bodyLabel') }}</label>
        <textarea
          :id="id"
          ref="textarea"
          v-model="text"
          :rows="mode === 'edit' ? 7 : 4"
          :placeholder="$t(placeholderKey)"
          :aria-invalid="isTooLong || undefined"
          :aria-describedby="`${id}-help ${id}-count`"
          class="block w-full resize-y rounded-row border border-line-strong bg-surface-solid px-3 py-2.5 font-mono text-[13px] leading-relaxed text-content"
          @keydown.ctrl.enter.prevent="submit"
          @keydown.meta.enter.prevent="submit"
        />
      </div>
      <div
        v-show="tab === 'preview'"
        :id="`${id}-panel-preview`"
        role="tabpanel"
        tabindex="0"
        :aria-labelledby="`${id}-tab-preview`"
      >
        <CommentPreview :text="text" :is-active="tab === 'preview'" />
      </div>
      <p :id="`${id}-help`" class="mt-1.5 text-xs text-muted">
        {{ $t(mode === 'edit' ? 'comments.composer.editHint' : 'comments.composer.markdownHelp') }}
      </p>
    </div>
    <div
      v-if="failure"
      role="alert"
      class="mt-2.5 flex items-start gap-2 rounded-row border border-negative px-3 py-2 text-sm text-negative"
      :class="mode === 'new' && 'mx-4'"
    >
      <AlertCircle aria-hidden="true" class="mt-0.5 size-4 shrink-0" />
      <span>
        {{ $t(failure.key, failure.params) }}
        <button
          v-if="failure.key === 'comments.failure.conflict'"
          type="button"
          class="font-semibold underline"
          @click="emit('reload')"
        >
          {{ $t('comments.composer.reload') }}
        </button>
      </span>
    </div>
    <div
      class="flex flex-wrap items-center justify-end gap-3 py-2.5"
      :class="mode === 'new' && 'px-4 pb-3.5'"
    >
      <span
        :id="`${id}-count`"
        class="mr-auto text-sm tabular-nums"
        :class="isTooLong ? 'text-negative' : 'text-muted'"
      >
        {{
          $t('comments.composer.counter', {
            used: formatNumber(text.length, locale.locale),
            max: formatNumber(COMMENT_MAX_LENGTH, locale.locale),
          })
        }}
      </span>
      <button v-if="mode === 'edit'" type="button" :class="SECONDARY" @click="emit('cancel')">
        {{ $t('comments.composer.cancel') }}
      </button>
      <button
        type="submit"
        :aria-disabled="cannotSend || undefined"
        :aria-busy="busy || undefined"
        class="inline-flex min-h-10 items-center rounded-pill bg-gradient-accent px-5 text-sm font-semibold text-on-accent aria-disabled:cursor-not-allowed aria-disabled:bg-none aria-disabled:bg-accent-soft aria-disabled:text-accent-soft-text"
      >
        {{ $t(submitKey) }}
      </button>
    </div>
  </form>
</template>
