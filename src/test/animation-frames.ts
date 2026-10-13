import { vi } from 'vitest';

/** requestAnimationFrame that queues callbacks by id; `runFrame(timestamp)` plays every callback queued before it. */
export function fakeAnimationFrames() {
  const queued = new Map<number, FrameRequestCallback>();
  let nextId = 0;
  const request = vi.fn((callback: FrameRequestCallback) => {
    nextId += 1;
    queued.set(nextId, callback);
    return nextId;
  });
  const cancel = vi.fn((id: number) => void queued.delete(id));
  vi.stubGlobal('requestAnimationFrame', request);
  vi.stubGlobal('cancelAnimationFrame', cancel);
  return {
    request,
    cancel,
    isQueued: () => queued.size > 0,
    runFrame(timestamp: number) {
      const callbacks = [...queued.values()];
      queued.clear();
      callbacks.forEach((callback) => callback(timestamp));
    },
  };
}
