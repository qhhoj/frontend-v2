<script setup lang="ts">
import { ExternalLink, FileText } from 'lucide-vue-next';
import { computed, onScopeDispose, ref, toRef, watch } from 'vue';
import { problemPdfUrl } from '@/api/problems.api';
import type { StatementLanguage } from '@/api/types/problems';
import { translate } from '@/i18n';
import AppButton from '@/components/ui/AppButton.vue';
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
/** AppButton exposes `focus`; the swap below moves the user's focus between the two. */
type Focusable = { focus: (options?: FocusOptions) => void };
const button = ref<Focusable | null>(null);
const link = ref<Focusable | null>(null);
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
/** The button shows only "PDF", so its name and tooltip say what it does in the current phase. */
const name = computed(() => {
  if (busy.value) return translate('problem.pdfPreparing');
  if (mustWait.value) return translate('problem.pdfRetryIn', { seconds: secondsToRetry.value });
  if (phase.value === 'failed') return translate('common.retry');
  return translate('problem.pdfRender');
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
  <div ref="root" class="relative">
    <AppButton
      v-if="phase === 'ready'"
      ref="link"
      tone="primary"
      size="sm"
      :href="href"
      target="_blank"
      rel="noopener"
      :title="$t('problem.pdfOpen')"
      :aria-label="$t('problem.pdfOpen')"
    >
      <template #icon><ExternalLink class="size-4" aria-hidden="true" /></template>
      PDF
    </AppButton>
    <AppButton
      v-else
      ref="button"
      size="sm"
      :tone="phase === 'failed' ? 'danger' : 'secondary'"
      data-testid="pdf-button"
      :title="name"
      :aria-label="name"
      :loading="busy"
      :disabled="mustWait"
      @click="onClick"
    >
      <template #icon><FileText class="size-4" aria-hidden="true" /></template>
      {{ mustWait ? `${secondsToRetry}s` : 'PDF' }}
    </AppButton>
    <span
      v-if="phase === 'failed'"
      class="absolute top-full right-0 z-10 mt-2 w-56 rounded-row border border-line bg-surface-solid p-3 text-sm text-negative"
      aria-hidden="true"
      >{{ $t(failureKey) }}</span
    >
    <span class="sr-only" role="status">{{
      phase === 'ready' ? $t('problem.pdfReady') : phase === 'failed' ? $t(failureKey) : ''
    }}</span>
  </div>
</template>
