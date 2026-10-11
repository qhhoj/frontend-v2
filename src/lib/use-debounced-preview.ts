import { onBeforeUnmount, ref, watch } from 'vue';
import type { WatchSource } from 'vue';
import { ApiError } from '@/api/client';

export const PREVIEW_DELAY_MS = 500;

/** The preview's visible state and the rules for a finished request (answer or failure). */
function createPreviewState() {
  const html = ref('');
  const isRateLimited = ref(false);
  const retryAfterSeconds = ref<number | null>(null);
  const failure = ref<unknown>(null);
  /** True from the keystroke until the answer (or refusal) for the newest text arrives. */
  const isUpdating = ref(false);
  /** When the last answer arrived; null before the first one. */
  const updatedAt = ref<Date | null>(null);
  /** Epoch ms until which the server asked us to wait (its `Retry-After`); no request is sent before it. */
  let pausedUntilMs = 0;

  function showAnswer(answer: string) {
    html.value = answer;
    isRateLimited.value = false;
    retryAfterSeconds.value = null;
    failure.value = null;
    updatedAt.value = new Date();
    isUpdating.value = false;
  }

  function showFailure(error: unknown) {
    const limit = error instanceof ApiError && error.code === 'rate_limited' ? error : null;
    isRateLimited.value = limit !== null;
    retryAfterSeconds.value = limit?.retryAfterSeconds ?? null;
    if (limit?.retryAfterSeconds) pausedUntilMs = Date.now() + limit.retryAfterSeconds * 1000;
    failure.value = limit ? null : error;
    isUpdating.value = false;
  }

  const isPaused = () => Date.now() < pausedUntilMs;
  return {
    html,
    isRateLimited,
    retryAfterSeconds,
    failure,
    isUpdating,
    updatedAt,
    showAnswer,
    showFailure,
    isPaused,
  };
}

export interface DebouncedPreviewOptions {
  /** While false nothing is sent (a hidden preview tab); turning true renders the current text. */
  isActive?: () => boolean;
  /** More inputs that change the rendering (the admin preview's style). */
  alsoWatch?: WatchSource[];
}

/** Board B: the preview follows the text 0.5 s after the last key; the newest request wins; a 429 keeps the last preview and pauses until its wait ends. */
export function useDebouncedPreview(
  markdown: () => string,
  render: (text: string) => Promise<string>,
  { isActive = () => true, alsoWatch = [] }: DebouncedPreviewOptions = {},
) {
  const state = createPreviewState();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let latest = 0;

  async function send(text: string, request: number) {
    try {
      const answer = await render(text);
      if (request === latest) state.showAnswer(answer);
    } catch (error) {
      if (request === latest) state.showFailure(error);
    }
  }

  function schedule() {
    clearTimeout(timer);
    const request = ++latest;
    const text = markdown();
    if (!isActive() || state.isPaused() || text.trim() === '') {
      if (text.trim() === '') state.html.value = '';
      state.isUpdating.value = false;
      return;
    }
    state.isUpdating.value = true;
    timer = setTimeout(() => void send(text, request), PREVIEW_DELAY_MS);
  }

  watch([markdown, isActive, ...alsoWatch], schedule, { immediate: true });
  onBeforeUnmount(() => clearTimeout(timer));
  return {
    html: state.html,
    isRateLimited: state.isRateLimited,
    retryAfterSeconds: state.retryAfterSeconds,
    failure: state.failure,
    isUpdating: state.isUpdating,
    updatedAt: state.updatedAt,
  };
}
