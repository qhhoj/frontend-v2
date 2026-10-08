import { onScopeDispose, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { probePdf } from '@/api/pdf';
import type { StatementLanguage } from '@/api/types/problems';

export type PdfPhase = 'idle' | 'preparing' | 'ready' | 'failed';
export const PDF_GIVE_UP_MS = 120_000;

export function usePdfStatement(code: Ref<string>, lang: Ref<StatementLanguage>) {
  const phase = ref<PdfPhase>('idle');
  /** Epoch ms before which `start` does nothing: the wait after 503 / 429. */
  const retryAt = ref(0);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | null = null;
  let deadline = 0;
  /** Bumped on every start, reset and dispose, so an answer that arrives late is dropped. */
  let generation = 0;

  const stop = () => {
    clearTimeout(timer);
    controller?.abort();
    controller = null;
    generation += 1;
  };

  async function poll(mine: number) {
    controller = new AbortController();
    try {
      const probe = await probePdf(code.value, lang.value, controller.signal);
      if (mine !== generation) return;
      if (probe.state === 'ready') phase.value = 'ready';
      else if (probe.state === 'unavailable') {
        retryAt.value = Date.now() + probe.retryAfterMs;
        phase.value = 'failed';
      } else if (Date.now() + probe.retryAfterMs > deadline) phase.value = 'failed';
      else timer = setTimeout(() => void poll(mine), probe.retryAfterMs);
    } catch {
      if (mine === generation) phase.value = 'failed';
    }
  }

  const start = () => {
    if (Date.now() < retryAt.value) return;
    stop();
    retryAt.value = 0;
    phase.value = 'preparing';
    deadline = Date.now() + PDF_GIVE_UP_MS;
    void poll(generation);
  };
  watch([code, lang], () => {
    stop();
    retryAt.value = 0;
    phase.value = 'idle';
  });
  onScopeDispose(stop);
  return { phase, retryAt, start };
}
