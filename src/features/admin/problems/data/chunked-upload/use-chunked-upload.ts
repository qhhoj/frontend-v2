import { onScopeDispose, ref, shallowRef, watch } from 'vue';
import { ApiError } from '@/api/client';
import {
  cancelDataUpload,
  completeDataUpload,
  createDataUpload,
  fetchDataUpload,
  putDataUploadChunk,
} from '@/api/problem-data.api';
import type { DataUpload } from '@/api/problem-data.api';
import type { ProblemData } from '@/api/types/problem-data';
import { missingChunks, planChunks } from './chunk-plan';
import { abortableWait, isBusy, isRetryable, withRetry } from './retry';
import { Sha256 } from './sha256';

export type ChunkedPhase = 'hashing' | 'uploading' | 'completing';
/** The code of the refusal a cancelled upload ends with; nothing to show for it. */
export const UPLOAD_CANCELLED = 'upload_cancelled';
/** The file could not be read (moved, changed or deleted since it was picked). */
export const FILE_UNREADABLE = 'file_unreadable';

const HASH_SLICE_BYTES = 8 * 1024 * 1024;
const CHUNK_RETRY = { attempts: 5, baseDelayMs: 1000 };
/** Complete can outlast Cloudflare's 100 s on a large archive: the retries (409 `busy` while it runs) wait about a minute, and a repeated complete answers the stored data. */
const COMPLETE_RETRY = { attempts: 6, baseDelayMs: 2000 };
/** A chunk that has not arrived in this long is on a dead connection: sent again (48 MiB at about 160 kB/s). */
const CHUNK_TIMEOUT_MS = 5 * 60 * 1000;
/** Complete joins, checks and stores up to 2 GiB on the server before it answers. */
const COMPLETE_TIMEOUT_MS = 5 * 60 * 1000;
/** Create, status and cancel answer at once; longer is a dead connection. */
const REQUEST_TIMEOUT_MS = 30 * 1000;
/** Once `finishing`, how long the upload waits for the server's outcome before it gives up showing it. */
const FINISHING_MAX_MS = 10 * 60 * 1000;
/** Longest backoff between rounds while `finishing`. */
const FINISHING_MAX_BACKOFF_MS = 60 * 1000;
/** The upload stopped waiting for a server that is still storing it; the outcome shows after a reload. */
export const UPLOAD_STILL_PROCESSING = 'upload_still_processing';

/** `signal`, also aborted (as a `network_error`) once `ms` pass. */
const timed = (ms: number, signal?: AbortSignal) =>
  signal ? AbortSignal.any([signal, AbortSignal.timeout(ms)]) : AbortSignal.timeout(ms);

/** An upload that stopped with its session kept on the server: what resuming needs. */
export interface InterruptedUpload {
  code: string;
  file: File;
  session: DataUpload;
}

const sameFile = (left: File, right: File) =>
  left.name === right.name && left.size === right.size && left.lastModified === right.lastModified;

/** The refusals after which the session is useless: it is gone, its bytes are wrong, or the zip itself is refused. */
const endsSession = (error: unknown) =>
  !(error instanceof ApiError) ||
  error.code === FILE_UNREADABLE ||
  error.code === 'not_found' ||
  error.issues.some(
    (issue) => issue.code === 'upload_hash_mismatch' || issue.code.startsWith('zip_'),
  );

/** The wait before the next `finishing` round: the backoff (capped), or the server's `Retry-After` when longer. */
function finishingDelay(error: unknown, round: number): number {
  const backoff = Math.min(COMPLETE_RETRY.baseDelayMs * 2 ** round, FINISHING_MAX_BACKOFF_MS);
  const retryAfter = error instanceof ApiError ? (error.retryAfterSeconds ?? 0) : 0;
  return Math.max(backoff, retryAfter * 1000);
}

/** A rate limit stays itself (its wait is the reason); anything else is `UPLOAD_STILL_PROCESSING`. */
const stillProcessing = (error: unknown) =>
  error instanceof ApiError && error.status === 429
    ? error
    : new ApiError(UPLOAD_STILL_PROCESSING, 0, 'The server is still processing the upload');

/** Bytes `start..end` of the file; a file that can no longer be read is the `FILE_UNREADABLE` refusal. */
async function readSlice(file: File, start: number, end: number): Promise<ArrayBuffer> {
  try {
    return await file.slice(start, end).arrayBuffer();
  } catch {
    throw new ApiError(FILE_UNREADABLE, 0, 'The file can no longer be read');
  }
}

/** The whole file's SHA-256, read a slice at a time; `onRead` gets the bytes read so far. */
async function hashFile(file: File, signal: AbortSignal, onRead: (bytes: number) => void) {
  const hasher = new Sha256();
  for (let start = 0; start < file.size; start += HASH_SLICE_BYTES) {
    signal.throwIfAborted();
    const end = Math.min(file.size, start + HASH_SLICE_BYTES);
    hasher.update(new Uint8Array(await readSlice(file, start, end)));
    onRead(end);
  }
  return hasher.hex();
}

/**
 * A data archive sent in chunks: hash, create the session, send the chunks the server lacks one at a time (each retried
 * with backoff), complete. An upload stopped by a failure the server allows to retry stays `interrupted` (for the
 * problem it was started on): picking the same file again, or resuming, continues it in this tab. `cancel`, and leaving
 * the page, stop it and drop the session; once the server is storing it (cancel refused), it is `finishing`: the upload
 * waits for the real outcome instead.
 */
export function useChunkedUpload(code: () => string) {
  const phase = ref<ChunkedPhase | null>(null);
  const doneBytes = ref(0);
  const totalBytes = ref(0);
  /** 1-based chunk being sent, and how many: progress that moves while a slow chunk is on its way. */
  const chunkNumber = ref(0);
  const chunkCount = ref(0);
  const interrupted = shallowRef<InterruptedUpload | null>(null);
  /** Cancel came too late: the server is storing the archive, so the upload waits for that outcome. */
  const finishing = ref(false);
  let controller: AbortController | null = null;
  let cancelling = false;
  const targetOf = (upload: InterruptedUpload) => ({ code: upload.code, id: upload.session.id });

  async function upload(file: File): Promise<ProblemData> {
    const problemCode = code();
    const kept = interrupted.value;
    if (kept && (kept.code !== problemCode || !sameFile(kept.file, file))) discard();
    controller = new AbortController();
    const { signal } = controller;
    totalBytes.value = file.size;
    try {
      const current = interrupted.value ?? (await begin(problemCode, file, signal));
      interrupted.value = current;
      signal.throwIfAborted();
      await sendMissing(current, signal);
      phase.value = 'completing';
      const saved = await completeStored(current, signal);
      interrupted.value = null;
      return saved;
    } catch (error) {
      throw settleFailure(error, signal);
    } finally {
      phase.value = null;
      finishing.value = false;
      controller = null;
    }
  }

  /**
   * Complete with retries. Once `finishing`, rounds of retries go on, with a backoff (or the server's `Retry-After`)
   * between them, until the server answers the stored data or a refusal; a wait past `FINISHING_MAX_MS` ends the
   * upload instead (the 429 itself, or `UPLOAD_STILL_PROCESSING`), its session kept.
   */
  async function completeStored(current: InterruptedUpload, signal: AbortSignal) {
    let deadline: number | null = null;
    for (let round = 0; ; round++) {
      try {
        return await withRetry(
          () => completeDataUpload(targetOf(current), timed(COMPLETE_TIMEOUT_MS, signal)),
          { ...COMPLETE_RETRY, signal },
        );
      } catch (error) {
        if (!finishing.value || !isRetryable(error)) throw error;
        deadline ??= Date.now() + FINISHING_MAX_MS;
        const delay = finishingDelay(error, round);
        if (Date.now() + delay > deadline) throw stillProcessing(error);
        await abortableWait(delay, signal);
      }
    }
  }

  async function begin(problemCode: string, file: File, signal: AbortSignal) {
    phase.value = 'hashing';
    doneBytes.value = 0;
    const sha256 = await hashFile(file, signal, (bytes) => (doneBytes.value = bytes));
    const session = await createDataUpload(
      problemCode,
      { name: file.name, size: file.size, sha256 },
      AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    );
    return { code: problemCode, file, session };
  }

  async function sendMissing(current: InterruptedUpload, signal: AbortSignal) {
    phase.value = 'uploading';
    const { file, session } = current;
    const { received } = await withRetry(
      () => fetchDataUpload(targetOf(current), timed(REQUEST_TIMEOUT_MS, signal)),
      { ...CHUNK_RETRY, signal },
    );
    const missing = missingChunks(planChunks(file.size, session.chunkBytes), received);
    doneBytes.value = file.size - missing.reduce((sum, span) => sum + span.end - span.start, 0);
    chunkCount.value = session.chunkCount;
    for (const span of missing) {
      chunkNumber.value = span.index + 1;
      const chunk = new Blob([await readSlice(file, span.start, span.end)]);
      const chunkTarget = { ...targetOf(current), index: span.index };
      const send = () => putDataUploadChunk(chunkTarget, chunk, timed(CHUNK_TIMEOUT_MS, signal));
      await withRetry(send, { ...CHUNK_RETRY, signal });
      doneBytes.value += span.end - span.start;
    }
  }

  /** A cancel ends as `UPLOAD_CANCELLED` (dropping a session a create answered meanwhile); a refusal that ends the session drops it; any other keeps it to resume. */
  function settleFailure(error: unknown, signal: AbortSignal): unknown {
    if (signal.aborted) {
      discard();
      return new ApiError(UPLOAD_CANCELLED, 0, 'Upload cancelled');
    }
    if (endsSession(error)) discard();
    return error;
  }

  /** Forgets the interrupted session and asks the server to drop it, retried while a chunk still holds it (best effort: it expires anyway). */
  function discard() {
    const stopped = interrupted.value;
    interrupted.value = null;
    if (stopped)
      void withRetry(
        () => cancelDataUpload(targetOf(stopped), timed(REQUEST_TIMEOUT_MS)),
        CHUNK_RETRY,
      ).catch(() => undefined);
  }

  /** Stops the upload and drops its session; while completing, only once the server agrees (else `finishing`). */
  function cancel() {
    if (phase.value === 'completing') return void cancelCompleting();
    controller?.abort();
    discard();
  }

  /**
   * The server drops the session only if it is not storing it. 409 `busy` (storing now) makes the upload `finishing`;
   * any other failure leaves it running with Hủy still offered (404: already stored, the complete answers it).
   */
  async function cancelCompleting() {
    const running = controller;
    const current = interrupted.value;
    if (cancelling || !running || !current) return;
    cancelling = true;
    try {
      await cancelDataUpload(targetOf(current), timed(REQUEST_TIMEOUT_MS));
      if (controller !== running) return;
      interrupted.value = null;
      running.abort();
    } catch (error) {
      if (controller === running && isBusy(error)) finishing.value = true;
    } finally {
      cancelling = false;
    }
  }

  /** The browser asks before a reload or close drops a running upload. */
  const confirmLeave = (event: BeforeUnloadEvent) => event.preventDefault();
  watch(phase, (running) => {
    if (running) window.addEventListener('beforeunload', confirmLeave);
    else window.removeEventListener('beforeunload', confirmLeave);
  });
  /** Leaving stops everything at once, `finishing` included: the server finishes without us, nobody is shown a result. */
  onScopeDispose(() => {
    window.removeEventListener('beforeunload', confirmLeave);
    controller?.abort();
    discard();
  });

  return {
    upload,
    cancel,
    phase,
    doneBytes,
    totalBytes,
    chunkNumber,
    chunkCount,
    interrupted,
    finishing,
  };
}
