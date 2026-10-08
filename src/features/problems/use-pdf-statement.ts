import { onScopeDispose, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { ApiError } from '@/api/client';
import { MIN_POLL_MS, probePdf } from '@/api/pdf';
import type { StatementLanguage } from '@/api/types/problems';

export type PdfPhase = 'idle' | 'preparing' | 'ready' | 'failed';
/** Why a run failed: no PDF for this statement, too many requests, or anything else. */
export type PdfFailure = 'missing' | 'rate_limited' | 'failed';
export const PDF_GIVE_UP_MS = 120_000;

export function usePdfStatement(code: Ref<string>, lang: Ref<StatementLanguage>) {
  const phase = ref<PdfPhase>('idle');
  const failure = ref<PdfFailure | null>(null);
  /** Epoch ms before which `start` does nothing: the server's wait, and never less than 3 s after the last probe. */
  const retryAt = ref(0);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let giveUp: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | null = null;
  /** Bumped on every start, reset, failure and dispose, so an answer that arrives late is dropped. */
  let generation = 0;
  let lastProbeAt = 0;

  /** Cancels the timers and the probe in flight; late answers are dropped. */
  const stop = () => {
    clearTimeout(timer);
    clearTimeout(giveUp);
    controller?.abort();
    controller = null;
    generation += 1;
  };

  const fail = (reason: PdfFailure, waitUntil = 0) => {
    stop();
    failure.value = reason;
    phase.value = 'failed';
    retryAt.value = Math.max(waitUntil, lastProbeAt + MIN_POLL_MS);
  };

  const failureOf = (error: unknown): PdfFailure =>
    error instanceof ApiError && error.code === 'not_found' ? 'missing' : 'failed';

  async function poll(mine: number) {
    controller = new AbortController();
    lastProbeAt = Date.now();
    try {
      const answer = await probePdf(code.value, lang.value, controller.signal);
      if (mine !== generation) return;
      if (answer.state === 'ready') {
        stop();
        phase.value = 'ready';
      } else if (answer.state === 'unavailable')
        fail(
          answer.reason === 'rate_limited' ? 'rate_limited' : 'failed',
          Date.now() + answer.retryAfterMs,
        );
      else timer = setTimeout(() => void poll(mine), answer.retryAfterMs);
    } catch (error) {
      if (mine === generation) fail(failureOf(error));
    }
  }

  const start = () => {
    if (Date.now() < retryAt.value) return;
    stop();
    retryAt.value = 0;
    failure.value = null;
    phase.value = 'preparing';
    giveUp = setTimeout(() => fail('failed'), PDF_GIVE_UP_MS);
    void poll(generation);
  };
  // A new statement starts from idle; a wait the server asked for still applies to it.
  watch([code, lang], () => {
    stop();
    failure.value = null;
    phase.value = 'idle';
  });
  onScopeDispose(stop);
  return { phase, failure, retryAt, start };
}
