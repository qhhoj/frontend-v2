import type { Ref } from 'vue';
import { fetchImportJob } from '@/api/problem-imports.api';
import type { ImportJob } from '@/api/types/problem-imports';
import {
  IMPORT_POLL_MS,
  MAX_POLL_RETRIES,
  UNKNOWN_STATE,
  isFinal,
  phaseOf,
  retryDelayMs,
  stopOfError,
} from './import-job';
import type { PollStop } from './import-job';

export interface PollerRefs {
  job: Ref<ImportJob | null>;
  failure: Ref<unknown>;
  stop: Ref<PollStop | null>;
}

type Answer = { next: ImportJob } | { error: unknown };

/**
 * Polls one job at a time. An answer for an older job id (or an older run) is dropped, so a replaced job can never
 * be overwritten and two loops never run at once. Stops on final states, on the stop reasons of `stopOfError`, and on dispose.
 */
export class ImportPoller {
  private timer: ReturnType<typeof setTimeout> | undefined;
  private isDisposed = false;
  /** Bumped on every start: an answer from an older run is dropped. */
  private run = 0;
  private retries = 0;

  constructor(private readonly refs: PollerRefs) {}

  start(id: string | null) {
    this.run += 1;
    clearTimeout(this.timer);
    this.refs.job.value = null;
    this.refs.failure.value = null;
    this.refs.stop.value = null;
    this.retries = 0;
    if (id) void this.poll(id, this.run);
  }

  dispose() {
    this.isDisposed = true;
    clearTimeout(this.timer);
  }

  private schedule(id: string, delay: number) {
    clearTimeout(this.timer);
    const current = this.run;
    this.timer = setTimeout(() => void this.poll(id, current), delay);
  }

  private async poll(id: string, current: number) {
    const answer: Answer = await fetchImportJob(id).then(
      (next) => ({ next }),
      (error: unknown) => ({ error }),
    );
    if (this.isDisposed || current !== this.run) return;
    if ('next' in answer) this.onJob(id, answer.next);
    else this.onFailure(id, answer.error);
  }

  private onJob(id: string, next: ImportJob) {
    this.refs.job.value = next;
    this.refs.failure.value = null;
    this.retries = 0;
    if (next.state === UNKNOWN_STATE) this.refs.stop.value = 'unknown';
    else if (!isFinal(phaseOf(next.state))) this.schedule(id, IMPORT_POLL_MS);
  }

  private onFailure(id: string, error: unknown) {
    const reason = stopOfError(error);
    if (reason) {
      this.refs.stop.value = reason;
      return;
    }
    this.refs.failure.value = error;
    this.retries += 1;
    if (this.retries > MAX_POLL_RETRIES) this.refs.stop.value = 'gaveUp';
    else this.schedule(id, retryDelayMs(this.retries));
  }
}
