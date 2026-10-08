import { onBeforeUnmount, ref, watch } from 'vue';
import { ApiError } from '@/api/client';
import { renderPreview } from '@/api/admin-common.api';
import type { PreviewSource } from '@/api/types/admin-common';

export const PREVIEW_DELAY_MS = 500;

/** The preview's visible state and the rules for a finished request (answer or failure). */
function createPreviewState() {
  const html = ref('');
  const isRateLimited = ref(false);
  const retryAfterSeconds = ref<number | null>(null);
  const failure = ref<unknown>(null);
  /** Epoch ms until which the server asked us to wait (its `Retry-After`); no request is sent before it. */
  let pausedUntilMs = 0;

  function showAnswer(answer: string) {
    html.value = answer;
    isRateLimited.value = false;
    retryAfterSeconds.value = null;
    failure.value = null;
  }

  function showFailure(error: unknown) {
    const limit = error instanceof ApiError && error.code === 'rate_limited' ? error : null;
    isRateLimited.value = limit !== null;
    retryAfterSeconds.value = limit?.retryAfterSeconds ?? null;
    if (limit?.retryAfterSeconds) pausedUntilMs = Date.now() + limit.retryAfterSeconds * 1000;
    failure.value = limit ? null : error;
  }

  const isPaused = () => Date.now() < pausedUntilMs;
  return { html, isRateLimited, retryAfterSeconds, failure, showAnswer, showFailure, isPaused };
}

/** Board B: the preview follows the text 0.5 s after the last key; the newest request wins; a 429 keeps the last preview and pauses until its wait ends. */
export function useRenderPreview(markdown: () => string, source: () => PreviewSource) {
  const state = createPreviewState();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let latest = 0;

  async function render(text: string, request: number) {
    try {
      const answer = await renderPreview(source(), text);
      if (request === latest) state.showAnswer(answer);
    } catch (error) {
      if (request === latest) state.showFailure(error);
    }
  }

  function schedule() {
    clearTimeout(timer);
    const request = ++latest;
    const text = markdown();
    if (state.isPaused()) return;
    if (text.trim() === '') {
      state.html.value = '';
      return;
    }
    timer = setTimeout(() => void render(text, request), PREVIEW_DELAY_MS);
  }

  watch([markdown, source], schedule, { immediate: true });
  onBeforeUnmount(() => clearTimeout(timer));
  return {
    html: state.html,
    isRateLimited: state.isRateLimited,
    retryAfterSeconds: state.retryAfterSeconds,
    failure: state.failure,
  };
}
