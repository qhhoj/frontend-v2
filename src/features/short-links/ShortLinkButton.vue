<script setup lang="ts">
import { Check, Link } from 'lucide-vue-next';
import { computed } from 'vue';
import { SHORT_LINK_DAILY_LIMIT } from '@/api/types/short-links';
import InlineBit from '@/components/InlineBit.vue';
import AppButton from '@/components/ui/AppButton.vue';
import IconButton from '@/components/ui/IconButton.vue';
import TextInput from '@/components/ui/TextInput.vue';
import { translate } from '@/i18n';
import { errorMessageKey } from '@/i18n/error-message';
import { useSessionStore } from '@/stores/session.store';
import { displayUrl } from './short-link-path';
import { SHORT_LINK_BITS } from './short-link-bits';
import { useShortLink } from './use-short-link';

/** "Sao chép liên kết ngắn" in a header's action row; full width on a phone. Signed-out viewers cannot create links. */
const props = defineProps<{
  path: string;
  /** An icon-only button (a card header); its notices open as a small panel below it. */
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
    <IconButton
      v-if="compact"
      tone="secondary"
      data-testid="short-link-button"
      :label="compactName"
      :pressed="state === 'copied' || undefined"
      :disabled="state === 'limited'"
      @click="copy"
    >
      <Check v-if="state === 'copied'" aria-hidden="true" />
      <Link v-else aria-hidden="true" />
    </IconButton>
    <AppButton
      v-else
      data-testid="short-link-button"
      class="max-sm:w-full"
      :pressed="state === 'copied' || undefined"
      :disabled="state === 'limited'"
      @click="copy"
    >
      <template #icon>
        <Check v-if="state === 'copied'" aria-hidden="true" class="size-4" />
        <Link v-else aria-hidden="true" class="size-4" />
      </template>
      {{ $t(labelKey) }}
    </AppButton>
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
      <TextInput
        readonly
        :model-value="url"
        :aria-label="$t('shortLink.manualLabel')"
        class="font-mono"
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
