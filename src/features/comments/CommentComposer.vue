<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { COMMENT_MAX_LENGTH } from '@/api/types/comments';
import AppButton from '@/components/ui/AppButton.vue';
import Notice from '@/components/ui/Notice.vue';
import Tabs from '@/components/ui/Tabs.vue';
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
const tab = ref('write');
const tabs = computed(() =>
  ['write', 'preview'].map((name) => ({
    key: name,
    label: t(`comments.composer.tab.${name}`),
    panelId: `${id}-panel-${name}`,
  })),
);
// A sent (cleared) draft starts over in the text.
watch(text, (value) => {
  if (value === '') tab.value = 'write';
});
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
      <AppButton tone="ghost" size="sm" @click="emit('cancelReply')">
        {{ $t('comments.composer.cancelReply') }}
      </AppButton>
    </div>
    <div :class="mode === 'new' ? 'px-4 pt-3.5' : 'pt-2'">
      <Tabs
        v-model="tab"
        :items="tabs"
        :label="$t('comments.composer.views')"
        overflow="scroll"
        class="mb-2"
      />
      <div
        v-show="tab === 'write'"
        :id="`${id}-panel-write`"
        role="tabpanel"
        :aria-labelledby="`${id}-panel-write-tab`"
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
          class="block w-full resize-y rounded-row border border-line-strong bg-surface-solid px-3 py-2.5 font-mono text-meta leading-relaxed text-content"
          @keydown.ctrl.enter.prevent="submit"
          @keydown.meta.enter.prevent="submit"
        />
      </div>
      <div
        v-show="tab === 'preview'"
        :id="`${id}-panel-preview`"
        role="tabpanel"
        tabindex="0"
        :aria-labelledby="`${id}-panel-preview-tab`"
      >
        <CommentPreview :text="text" :is-active="tab === 'preview'" />
      </div>
      <p :id="`${id}-help`" class="mt-1.5 text-xs text-muted">
        {{ $t(mode === 'edit' ? 'comments.composer.editHint' : 'comments.composer.markdownHelp') }}
      </p>
    </div>
    <Notice v-if="failure" tone="danger" class="mt-2.5" :class="mode === 'new' && 'mx-4'">
      {{ $t(failure.key, failure.params) }}
      <template v-if="failure.key === 'comments.failure.conflict'" #action>
        <AppButton size="sm" @click="emit('reload')">{{
          $t('comments.composer.reload')
        }}</AppButton>
      </template>
    </Notice>
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
      <AppButton v-if="mode === 'edit'" @click="emit('cancel')">
        {{ $t('comments.composer.cancel') }}
      </AppButton>
      <AppButton tone="primary" type="submit" :disabled="cannotSend" :loading="busy">
        {{ $t(submitKey) }}
      </AppButton>
    </div>
  </form>
</template>
