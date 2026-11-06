import { ref, shallowRef } from 'vue';
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

const HASH_SLICE_BYTES = 8 * 1024 * 1024;
const CHUNK_RETRY = { attempts: 5, baseDelayMs: 1000 };
/** Complete can outlast Cloudflare's 100 s on a large archive: the retries (409 `busy` while it runs) wait about a minute, and a repeated complete answers the stored data. */
const COMPLETE_RETRY = { attempts: 6, baseDelayMs: 2000 };

const sameFile = (left: File, right: File) =>
  left.name === right.name && left.size === right.size && left.lastModified === right.lastModified;

/** The whole file's SHA-256, read a slice at a time; `onRead` gets the bytes read so far. */
async function hashFile(file: File, signal: AbortSignal, onRead: (bytes: number) => void) {
  const hasher = new Sha256();
  for (let start = 0; start < file.size; start += HASH_SLICE_BYTES) {
    signal.throwIfAborted();
    const slice = file.slice(start, start + HASH_SLICE_BYTES);
    hasher.update(new Uint8Array(await slice.arrayBuffer()));
    onRead(Math.min(file.size, start + HASH_SLICE_BYTES));
  }
  return hasher.hex();
}

/**
 * A data archive sent in chunks: hash, create the session, send the chunks the server lacks one at a time (each retried
 * with backoff), complete. An upload stopped by a lasting network or server failure stays `interrupted`: picking the
 * same file again resumes it in this tab. `cancel` stops it and drops the session.
 */
export function useChunkedUpload(code: () => string) {
  const phase = ref<ChunkedPhase | null>(null);
  const doneBytes = ref(0);
  const totalBytes = ref(0);
  const interrupted = shallowRef<{ file: File; session: DataUpload } | null>(null);
  let controller: AbortController | null = null;
  const target = (session: DataUpload) => ({ code: code(), id: session.id });

  async function upload(file: File): Promise<ProblemData> {
    if (interrupted.value && !sameFile(interrupted.value.file, file)) discard();
    controller = new AbortController();
    const { signal } = controller;
    totalBytes.value = file.size;
    try {
      const session = interrupted.value?.session ?? (await begin(file, signal));
      interrupted.value = { file, session };
      await sendMissing(file, session, signal);
      phase.value = 'completing';
      const saved = await withRetry(() => completeDataUpload(target(session)), {
        ...COMPLETE_RETRY,
        signal,
      });
      interrupted.value = null;
      return saved;
    } catch (error) {
      throw settleFailure(error, signal);
    } finally {
      phase.value = null;
      controller = null;
    }
  }

  async function begin(file: File, signal: AbortSignal): Promise<DataUpload> {
    phase.value = 'hashing';
    doneBytes.value = 0;
    const sha256 = await hashFile(file, signal, (bytes) => (doneBytes.value = bytes));
    return createDataUpload(code(), { name: file.name, size: file.size, sha256 });
  }

  async function sendMissing(file: File, session: DataUpload, signal: AbortSignal) {
    phase.value = 'uploading';
    const { received } = await withRetry(() => fetchDataUpload(target(session), signal), {
      ...CHUNK_RETRY,
      signal,
    });
    const missing = missingChunks(planChunks(file.size, session.chunkBytes), received);
    doneBytes.value = file.size - missing.reduce((sum, span) => sum + span.end - span.start, 0);
    for (const span of missing) {
      const chunk = file.slice(span.start, span.end);
      const chunkTarget = { ...target(session), index: span.index };
      await withRetry(() => putDataUploadChunk(chunkTarget, chunk, signal), {
        ...CHUNK_RETRY,
        signal,
      });
      doneBytes.value += span.end - span.start;
    }
  }

  /** A cancel ends as `UPLOAD_CANCELLED`; a lasting transient failure keeps the session to resume; any other refusal drops it. */
  function settleFailure(error: unknown, signal: AbortSignal): unknown {
    if (signal.aborted) return new ApiError(UPLOAD_CANCELLED, 0, 'Upload cancelled');
    if (!isRetryable(error)) discard();
    return error;
  }

  /** Forgets the interrupted session and asks the server to drop it (best effort: it expires anyway). */
  function discard() {
    const stopped = interrupted.value;
    interrupted.value = null;
    if (stopped) void cancelDataUpload(target(stopped.session)).catch(() => undefined);
  }

  function cancel() {
    controller?.abort();
    discard();
  }

  return { upload, cancel, phase, doneBytes, totalBytes, interrupted };
}
