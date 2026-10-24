<script setup lang="ts">
import { Check, Link } from 'lucide-vue-next';
import { computed } from 'vue';
import { SHORT_LINK_DAILY_LIMIT } from '@/api/types/short-links';
import InlineBit from '@/components/InlineBit.vue';
import { translate } from '@/i18n';
import { errorMessageKey } from '@/i18n/error-message';
import { useSessionStore } from '@/stores/session.store';
import { displayUrl } from './short-link-path';
import { SHORT_LINK_BITS } from './short-link-bits';
import { useShortLink } from './use-short-link';

/** "Sao chép liên kết ngắn" in a header's action row; full width on a phone. Signed-out viewers cannot create links. */
const props = defineProps<{
  path: string;
  /** A 40 px round icon button (a card header); its notices open as a small panel below it. */
  compact?: boolean;
}>();
const session = useSessionStore();
const isSignedIn = computed(() => session.status === 'authenticated');
const { state, url, failure, copy } = useShortLink(() => props.path);
const LABEL_KEYS = { creating: 'shortLink.creating', copied: 'shortLink.copied' } as const;
const labelKey = computed(() =>
  state.value === 'creating' || state.value === 'copied'
    ? LABEL_KEYS[state.value]
    : 'shortLink.copy',
);
/** The compact button shows no text, so its name (and tooltip) is the label of the state; the full button is named by its text. */
const compactName = computed(() => translate(labelKey.value));
/** Notices stack under the full button; under the icon button they float, so the header row keeps its height. */
const noticeClass = computed(() =>
  props.compact
    ? 'absolute top-full right-0 z-10 mt-2 w-64 rounded-row border border-line bg-surface-solid p-3'
    : '',
);
const announcement = computed(() =>
  state.value === 'copied' && url.value
    ? translate('shortLink.copiedAnnounce', { url: displayUrl(url.value) })
    : '',
);
const selectAll = (event: FocusEvent) => (event.target as HTMLInputElement).select();
</script>

<template>
  <div
    v-if="isSignedIn"
    data-testid="short-link"
    :class="compact ? 'relative' : 'flex flex-col gap-2 max-sm:w-full'"
  >
    <button
      type="button"
      data-testid="short-link-button"
      class="inline-flex items-center justify-center rounded-pill border font-semibold"
      :class="[
        compact
          ? 'size-10 cursor-pointer touch:size-11'
          : 'min-h-11 gap-2 px-4 text-sm max-sm:w-full',
        state === 'copied'
          ? 'border-accent bg-accent-soft text-accent-soft-text'
          : compact
            ? 'border-line bg-surface text-content hover:bg-surface-hover'
            : 'border-line-strong bg-surface-solid text-content hover:bg-surface-hover',
      ]"
      :aria-label="compact ? compactName : undefined"
      :title="compact ? compactName : undefined"
      :aria-disabled="state === 'limited' || undefined"
      @click="copy"
    >
      <Check v-if="state === 'copied'" aria-hidden="true" class="size-4" />
      <Link v-else aria-hidden="true" class="size-4" />
      <span v-if="!compact">{{ $t(labelKey) }}</span>
    </button>
    <p class="sr-only" aria-live="polite">{{ announcement }}</p>
    <p
      v-if="state === 'limited'"
      role="alert"
      class="flex max-w-sm items-start gap-2 text-sm"
      :class="noticeClass"
    >
      <InlineBit :kind="SHORT_LINK_BITS.limited" />
      <span
        ><strong>{{ $t('shortLink.limitTitle', { limit: SHORT_LINK_DAILY_LIMIT }) }}</strong>
        {{ $t('shortLink.limitBody') }}</span
      >
    </p>
    <div
      v-else-if="state === 'manual' && url"
      class="flex max-w-sm flex-col gap-1 text-sm"
      :class="noticeClass"
    >
      <p class="flex items-center gap-2">
        <InlineBit :kind="SHORT_LINK_BITS.manual" />{{ $t('shortLink.clipboardBlocked') }}
      </p>
      <input
        readonly
        :value="url"
        :aria-label="$t('shortLink.manualLabel')"
        class="min-h-11 rounded-row border border-line-control bg-surface-solid px-3 font-mono text-content"
        @focus="selectAll"
      />
    </div>
    <p
      v-else-if="state === 'failed'"
      role="alert"
      class="flex items-center gap-2 text-sm text-negative"
      :class="noticeClass"
    >
      <InlineBit :kind="SHORT_LINK_BITS.problem" />{{ $t(errorMessageKey(failure)) }}
    </p>
  </div>
</template>
