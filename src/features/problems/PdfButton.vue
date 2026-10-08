<script setup lang="ts">
import { ExternalLink, FileText } from 'lucide-vue-next';
import { computed, onScopeDispose, ref, toRef, watch } from 'vue';
import { problemPdfUrl } from '@/api/problems.api';
import type { StatementLanguage } from '@/api/types/problems';
import { usePdfStatement } from './use-pdf-statement';
import type { PdfFailure } from './use-pdf-statement';

const COUNTDOWN_TICK_MS = 1000;
const FAILURE_KEYS: Record<PdfFailure, string> = {
  missing: 'problem.pdfMissing',
  rate_limited: 'problem.pdfRateLimited',
  failed: 'problem.pdfFailed',
};

const props = defineProps<{ code: string; lang: StatementLanguage }>();
const { phase, failure, retryAt, start } = usePdfStatement(
  toRef(props, 'code'),
  toRef(props, 'lang'),
);
const root = ref<HTMLElement | null>(null);
const button = ref<HTMLButtonElement | null>(null);
const link = ref<HTMLAnchorElement | null>(null);
const href = computed(() => problemPdfUrl(props.code, props.lang));
const failureKey = computed(() => FAILURE_KEYS[failure.value ?? 'failed']);

// The countdown ticks once a second, and only while a server wait is pending.
const now = ref(Date.now());
let ticker: ReturnType<typeof setInterval> | undefined;
const stopTicker = () => {
  clearInterval(ticker);
  ticker = undefined;
};
watch(retryAt, (at) => {
  now.value = Date.now();
  if (at <= now.value || ticker) return;
  ticker = setInterval(() => {
    now.value = Date.now();
    if (now.value >= retryAt.value) stopTicker();
  }, COUNTDOWN_TICK_MS);
});
onScopeDispose(stopTicker);
const mustWait = computed(() => retryAt.value > now.value);
/** Whole seconds left, rounded down so the count never runs ahead of the server's wait; at least 1 while waiting. */
const secondsToRetry = computed(() => Math.max(1, Math.floor((retryAt.value - now.value) / 1000)));
const busy = computed(() => phase.value === 'preparing');
const unavailable = computed(() => busy.value || mustWait.value);
const buttonClass = computed(() => {
  if (busy.value) return 'border-line-accent bg-accent-soft text-accent-soft-text';
  if (mustWait.value) return 'cursor-not-allowed border-line bg-surface text-muted';
  return 'border-line bg-surface';
});

const onClick = () => {
  if (!unavailable.value) start();
};

// Focus stays with the user across the swap between the button and the link: it is noted before
// the swap (sync) and moved onto the control that replaces the old one once the DOM is updated (post).
let focusWithinControl = false;
watch(
  phase,
  () => {
    focusWithinControl = root.value?.contains(document.activeElement) ?? false;
  },
  { flush: 'sync' },
);
watch(
  phase,
  () => {
    if (focusWithinControl && !root.value?.contains(document.activeElement))
      (link.value ?? button.value)?.focus();
  },
  { flush: 'post' },
);
</script>

<template>
  <div ref="root" class="flex max-w-full flex-wrap items-center gap-3">
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
      v-else
      ref="button"
      type="button"
      :aria-busy="busy ? 'true' : undefined"
      :aria-disabled="unavailable"
      :class="buttonClass"
      class="inline-flex h-11 items-center gap-2 rounded-pill border px-[18px] font-semibold whitespace-nowrap"
      @click="onClick"
    >
      <span v-if="busy" class="pdf-ring" aria-hidden="true" />
      <FileText v-else class="size-4" aria-hidden="true" />
      {{
        busy
          ? $t('problem.pdfPreparing')
          : mustWait
            ? $t('problem.pdfRetryIn', { seconds: secondsToRetry })
            : phase === 'failed'
              ? $t('problem.pdfRetry')
              : $t('problem.pdf')
      }}
    </button>
    <span v-if="phase === 'failed'" class="text-negative" aria-hidden="true">{{
      $t(failureKey)
    }}</span>
    <span class="sr-only" role="status">{{
      phase === 'ready' ? $t('problem.pdfReady') : phase === 'failed' ? $t(failureKey) : ''
    }}</span>
  </div>
</template>
