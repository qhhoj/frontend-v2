/** Above this, an archive goes in chunks; at or below it, one request (Cloudflare refuses more than 100 MB in one). */
export const SINGLE_UPLOAD_MAX_BYTES = 48 * 1024 * 1024;

export interface ChunkSpan {
  index: number;
  /** First byte, inclusive. */
  start: number;
  /** Last byte, exclusive. */
  end: number;
}

/** The byte spans of a file of `size` cut every `chunkBytes` (the server's size); the last span holds the rest. */
export function planChunks(size: number, chunkBytes: number): ChunkSpan[] {
  const count = Math.ceil(size / chunkBytes);
  return Array.from({ length: count }, (_item, index) => ({
    index,
    start: index * chunkBytes,
    end: Math.min(size, (index + 1) * chunkBytes),
  }));
}

/** The spans the server does not hold yet, in order. */
export const missingChunks = (plan: readonly ChunkSpan[], received: readonly number[]) =>
  plan.filter((span) => !received.includes(span.index));
