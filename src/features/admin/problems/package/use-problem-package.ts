import { computed, onScopeDispose, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { MAX_WAIT_MS, MIN_POLL_MS } from '@/api/pdf';
import { packageDownloadUrl, probePackage, requestPackage } from '@/api/problem-package.api';
import type { PackageFailure, PackageProbe } from '@/api/problem-package.api';
import { translate } from '@/i18n';
import { failureTextOf } from '../../ui/admin-errors';

export type PackagePhase = 'idle' | 'requesting' | 'building' | 'ready' | 'failed';
/** The longest the card waits for a build before it stops asking (same bound as the PDF probe's longest wait). */
export const PACKAGE_GIVE_UP_MS = MAX_WAIT_MS;

const probeFailureText = (reason: PackageFailure) =>
  translate(reason === 'generic' ? 'errors.generic' : `errors.${reason}`);

interface PollerHooks {
  onReady: () => void;
  onFail: (text: string) => void;
}

/** Probes GET at the server's pace until ready, failed, timed out or stopped. */
function createPackagePoller(code: () => string, hooks: PollerHooks) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | null = null;
  /** Bumped on every start, failure and stop, so a late answer is dropped. */
  let generation = 0;
  let startedAt = 0;
  /** Cancels the timer and the probe in flight, opens a new generation and restarts the give-up clock. */
  const reset = () => {
    clearTimeout(timer);
    controller?.abort();
    startedAt = Date.now();
    generation += 1;
    return generation;
  };
  const fail = (text: string) => {
    reset();
    hooks.onFail(text);
  };
  const schedule = (mine: number, delayMs: number) => {
    if (Date.now() - startedAt + delayMs > PACKAGE_GIVE_UP_MS)
      return fail(translate('admin.package.timeout'));
    timer = setTimeout(() => void poll(mine), delayMs);
  };
  const settle = (answer: PackageProbe, mine: number) => {
    if (answer.state === 'building') return schedule(mine, answer.retryAfterMs);
    if (answer.state === 'failed') return fail(probeFailureText(answer.reason));
    reset();
    hooks.onReady();
  };
  async function poll(mine: number) {
    controller = new AbortController();
    try {
      const answer = await probePackage(code(), controller.signal);
      if (mine === generation) settle(answer, mine);
    } catch (error) {
      if (mine === generation) fail(failureTextOf(error));
    }
  }
  return { reset, schedule, fail, isCurrent: (mine: number) => mine === generation };
}

/**
 * One POST per click (the rate-limited call), then GET probes at the server's `Retry-After` pace until the zip is ready,
 * the build fails, or `PACKAGE_GIVE_UP_MS` passes. Leaving the tab (scope dispose) stops the timer and the probe in flight.
 */
export function useProblemPackage(code: MaybeRefOrGetter<string>) {
  const phase = ref<PackagePhase>('idle');
  const failureText = ref('');
  const poller = createPackagePoller(() => toValue(code), {
    onReady: () => {
      phase.value = 'ready';
    },
    onFail: (text) => {
      failureText.value = text;
      phase.value = 'failed';
    },
  });
  async function start() {
    if (phase.value === 'requesting' || phase.value === 'building') return;
    const mine = poller.reset();
    failureText.value = '';
    phase.value = 'requesting';
    try {
      const status = await requestPackage(toValue(code));
      if (!poller.isCurrent(mine)) return;
      phase.value = status.status === 'ready' ? 'ready' : 'building';
      if (status.status === 'building') poller.schedule(mine, MIN_POLL_MS);
    } catch (error) {
      if (poller.isCurrent(mine)) poller.fail(failureTextOf(error));
    }
  }
  onScopeDispose(poller.reset);
  return {
    phase,
    failureText,
    start,
    downloadUrl: computed(() => packageDownloadUrl(toValue(code))),
  };
}
