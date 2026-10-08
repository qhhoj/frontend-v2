import { onBeforeUnmount, ref, watch } from 'vue';
import { ApiError } from '@/api/client';
import { renderPreview } from '@/api/admin-common.api';
import type { PreviewSource } from '@/api/types/admin-common';

export const PREVIEW_DELAY_MS = 500;

/** Board B: the preview follows the text 0.5 s after the last key; the newest request wins; a 429 keeps the last preview. */
export function useRenderPreview(markdown: () => string, source: () => PreviewSource) {
  const html = ref('');
  const isRateLimited = ref(false);
  const retryAfterSeconds = ref<number | null>(null);
  const failure = ref<unknown>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let latest = 0;

  async function render(text: string, request: number) {
    try {
      const answer = await renderPreview(source(), text);
      if (request !== latest) return;
      html.value = answer;
      isRateLimited.value = false;
      retryAfterSeconds.value = null;
      failure.value = null;
    } catch (error) {
      if (request !== latest) return;
      const limit = error instanceof ApiError && error.code === 'rate_limited' ? error : null;
      isRateLimited.value = limit !== null;
      retryAfterSeconds.value = limit?.retryAfterSeconds ?? null;
      failure.value = limit ? null : error;
    }
  }

  function schedule() {
    clearTimeout(timer);
    const request = ++latest;
    const text = markdown();
    if (text.trim() === '') {
      html.value = '';
      return;
    }
    timer = setTimeout(() => void render(text, request), PREVIEW_DELAY_MS);
  }

  watch([markdown, source], schedule, { immediate: true });
  onBeforeUnmount(() => clearTimeout(timer));
  return { html, isRateLimited, retryAfterSeconds, failure };
}
