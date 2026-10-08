<script setup lang="ts">
import { ExternalLink, FileText } from 'lucide-vue-next';
import { computed, ref, toRef, watch } from 'vue';
import { problemPdfUrl } from '@/api/problems.api';
import type { StatementLanguage } from '@/api/types/problems';
import { useNow } from '@/lib/use-now';
import { usePdfStatement } from './use-pdf-statement';

const props = defineProps<{ code: string; lang: StatementLanguage }>();
const { phase, retryAt, start } = usePdfStatement(toRef(props, 'code'), toRef(props, 'lang'));
const now = useNow();
const busyButton = ref<HTMLButtonElement | null>(null);
const link = ref<HTMLAnchorElement | null>(null);
const href = computed(() => problemPdfUrl(props.code, props.lang));
/** Whole seconds left, rounded down so the count never runs ahead of the server's wait; at least 1 while waiting. */
const secondsToRetry = computed(() => Math.max(1, Math.floor((retryAt.value - now.value) / 1000)));
const mustWait = computed(() => retryAt.value > now.value);

const onClick = () => {
  if (!mustWait.value) start();
};

/**
 * The busy button disappears when the PDF is ready. Keyboard users keep their place: the focus is noted before the
 * button is removed (sync watch) and moved onto the link once the link is rendered (post watch).
 */
let focusWasOnBusyButton = false;
watch(
  phase,
  (next) => {
    focusWasOnBusyButton = next === 'ready' && document.activeElement === busyButton.value;
  },
  { flush: 'sync' },
);
watch(
  link,
  (anchor) => {
    if (anchor && focusWasOnBusyButton) anchor.focus();
  },
  { flush: 'post' },
);
</script>

<template>
  <div class="flex max-w-full flex-wrap items-center gap-3">
    <a
      v-if="phase === 'ready'"
      ref="link"
      :href="href"
      target="_blank"
      rel="noopener"
      class="inline-flex h-11 items-center gap-2 rounded-pill bg-gradient-accent px-[18px] font-semibold whitespace-nowrap text-on-accent"
    >
      <ExternalLink class="size-4" aria-hidden="true" />
      {{ $t('problem.pdfOpen') }}
    </a>
    <button
      v-else-if="phase === 'preparing'"
      ref="busyButton"
      type="button"
      aria-busy="true"
      aria-disabled="true"
      class="inline-flex h-11 items-center gap-2 rounded-pill border border-line-accent bg-accent-soft px-[18px] font-semibold whitespace-nowrap text-accent-soft-text"
    >
      <span class="pdf-ring" aria-hidden="true" />
      {{ $t('problem.pdfPreparing') }}
    </button>
    <button
      v-else
      type="button"
      :aria-disabled="mustWait"
      class="inline-flex h-11 items-center gap-2 rounded-pill border border-line bg-surface px-[18px] font-semibold whitespace-nowrap"
      @click="onClick"
    >
      <FileText class="size-4" aria-hidden="true" />
      <template v-if="phase === 'failed'">
        {{
          mustWait ? $t('problem.pdfRetryIn', { seconds: secondsToRetry }) : $t('problem.pdfRetry')
        }}
      </template>
      <template v-else>{{ $t('problem.pdf') }}</template>
    </button>
    <span v-if="phase === 'failed'" class="text-negative">{{ $t('problem.pdfFailed') }}</span>
    <span class="sr-only" role="status">{{
      phase === 'ready' ? $t('problem.pdfReady') : phase === 'failed' ? $t('problem.pdfFailed') : ''
    }}</span>
  </div>
</template>
