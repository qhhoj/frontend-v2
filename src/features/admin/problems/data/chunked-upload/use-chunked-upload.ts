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
import { isRetryable, withRetry } from './retry';
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

  /** Complete with retries; once `finishing`, the retries go on until the server answers the stored data or a refusal. */
  async function completeStored(current: InterruptedUpload, signal: AbortSignal) {
    for (;;) {
      try {
        return await withRetry(() => completeDataUpload(targetOf(current), signal), {
          ...COMPLETE_RETRY,
          signal,
        });
      } catch (error) {
        if (!finishing.value || !isRetryable(error)) throw error;
      }
    }
  }

  async function begin(problemCode: string, file: File, signal: AbortSignal) {
    phase.value = 'hashing';
    doneBytes.value = 0;
    const sha256 = await hashFile(file, signal, (bytes) => (doneBytes.value = bytes));
    const session = await createDataUpload(problemCode, {
      name: file.name,
      size: file.size,
      sha256,
    });
    return { code: problemCode, file, session };
  }

  async function sendMissing(current: InterruptedUpload, signal: AbortSignal) {
    phase.value = 'uploading';
    const { file, session } = current;
    const { received } = await withRetry(() => fetchDataUpload(targetOf(current), signal), {
      ...CHUNK_RETRY,
      signal,
    });
    const missing = missingChunks(planChunks(file.size, session.chunkBytes), received);
    doneBytes.value = file.size - missing.reduce((sum, span) => sum + span.end - span.start, 0);
    chunkCount.value = session.chunkCount;
    for (const span of missing) {
      chunkNumber.value = span.index + 1;
      const chunk = new Blob([await readSlice(file, span.start, span.end)]);
      const chunkTarget = { ...targetOf(current), index: span.index };
      const send = () =>
        putDataUploadChunk(
          chunkTarget,
          chunk,
          AbortSignal.any([signal, AbortSignal.timeout(CHUNK_TIMEOUT_MS)]),
        );
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
      void withRetry(() => cancelDataUpload(targetOf(stopped)), CHUNK_RETRY).catch(() => undefined);
  }

  /** Stops the upload and drops its session; while completing, only once the server agrees (else `finishing`). */
  function cancel() {
    if (phase.value === 'completing') return void cancelCompleting();
    controller?.abort();
    discard();
  }

  /** The server drops the session only if it is not storing it (409 `busy` while it is, 404 once stored): any refusal leaves the complete running to its real outcome. */
  async function cancelCompleting() {
    const running = controller;
    const current = interrupted.value;
    if (cancelling || !running || !current) return;
    cancelling = true;
    try {
      await cancelDataUpload(targetOf(current));
      if (controller !== running) return;
      interrupted.value = null;
      running.abort();
    } catch {
      if (controller === running) finishing.value = true;
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
  onScopeDispose(() => {
    window.removeEventListener('beforeunload', confirmLeave);
    cancel();
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
