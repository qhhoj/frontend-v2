import { useQueryClient } from '@tanstack/vue-query';
import type { QueryKey } from '@tanstack/vue-query';
import { computed, onScopeDispose, readonly, ref, shallowReactive, toValue, watch } from 'vue';
import type { MaybeRefOrGetter, Ref } from 'vue';
import { buildUrl } from './client';
import { fillPath } from './typed';
import type { StreamData, StreamEventName, StreamPath } from './typed';

/** The stream to hold: a stream route, its path parameters and the account it is opened for. */
export interface LiveTarget<Path extends StreamPath> {
  route: Path;
  params?: Record<string, string>;
  /** The viewer the server authorised the stream for: a new one reopens it although the path is the same. */
  viewer?: string;
}

/** What each named frame means; a frame with no handler is not listened to. */
export type FrameHandlers<Path extends StreamPath> = {
  [Name in StreamEventName<Path>]?: (data: StreamData<Path, Name>) => void;
};

export interface LiveStreamOptions<Path extends StreamPath> {
  frames: NoInfer<FrameHandlers<Path>>;
  /** The cached reads the frames make stale: `refresh`, `reconnect` and a `resync` frame (unless handled in `frames`) invalidate them. */
  cacheKey?: () => QueryKey;
  /** The stream closed (target changed, reconnect, `close` or scope end): drop what it left half done. */
  onClose?: () => void;
  /** The browser gave up on the stream for good (refused with 403/404/429 or closed by the server). */
  onGiveUp?: () => void;
}

export interface LiveStream {
  /** The browser gave up reconnecting; the next (re)open clears it. */
  paused: Readonly<Ref<boolean>>;
  /** Opens the stream again and refreshes the cached reads, which may have missed frames while it was down. */
  reconnect(): void;
  /** Invalidates the cached reads of `cacheKey`. */
  refresh(): Promise<void>;
  /** Closes the stream until the target changes or `reconnect` is called. */
  close(): void;
}

interface OpenStream {
  paused: Ref<boolean>;
  reconnect(): void;
}
/** The open stream per path, for a page that shows the paused notice of a stream it does not own. */
const openByPath = shallowReactive(new Map<string, OpenStream>());
const pathOf = (target: LiveTarget<StreamPath>) => fillPath(target.route, target.params);

export const isLiveStreamPaused = (target: LiveTarget<StreamPath>): boolean =>
  openByPath.get(pathOf(target))?.paused.value === true;
export const reconnectLiveStream = (target: LiveTarget<StreamPath>): void =>
  openByPath.get(pathOf(target))?.reconnect();

type RawHandlers = Record<string, (data: object) => void>;

const parseFrame = (event: Event): object | null => {
  try {
    const data: unknown = JSON.parse((event as MessageEvent<string>).data);
    return typeof data === 'object' && data !== null ? data : null;
  } catch {
    return null;
  }
};

/**
 * One EventSource on `/api/internal<path>`: each named event goes to its handler as parsed JSON, and nothing after `close`.
 * While the connection drops the browser reconnects by itself, waiting the server's `retry: 3000`; `onGiveUp` fires once it stops for good.
 */
function connect(path: string, handlers: RawHandlers, onGiveUp: () => void) {
  const source = new EventSource(buildUrl(path));
  let isClosed = false;
  for (const [name, handle] of Object.entries(handlers))
    source.addEventListener(name, (event) => {
      const data = parseFrame(event);
      if (data && !isClosed) handle(data);
    });
  source.addEventListener('error', () => {
    if (!isClosed && source.readyState === EventSource.CLOSED) onGiveUp();
  });
  return {
    close() {
      isClosed = true;
      source.close();
    },
  };
}

type HolderHooks = Pick<LiveStreamOptions<StreamPath>, 'onClose' | 'onGiveUp'>;

/** At most one open connection; while open it speaks for its path in the registry. */
function createHolder(handlers: RawHandlers, owner: OpenStream, hooks: HolderHooks) {
  let stream: { path: string; close(): void } | null = null;
  const giveUp = () => {
    owner.paused.value = true;
    hooks.onGiveUp?.();
  };
  return {
    open(path: string) {
      stream = { path, ...connect(path, handlers, giveUp) };
      openByPath.set(path, owner);
    },
    close: () => {
      if (!stream) return;
      stream.close();
      if (openByPath.get(stream.path) === owner) openByPath.delete(stream.path);
      stream = null;
      hooks.onClose?.();
    },
  };
}

/** The caller's handlers, plus a `resync` that refreshes the cached reads when the caller does not handle it. */
function handlersOf(options: LiveStreamOptions<StreamPath>, refresh: () => Promise<void>) {
  const handlers = { ...options.frames } as RawHandlers;
  if (options.cacheKey) handlers.resync ??= () => void refresh();
  return handlers;
}

/**
 * Holds one live stream (SSE) while `target` is set: reopened when its path or viewer changes, closed when it is null
 * and on scope end. Features only say what a frame means; this owns the connection, give-up, reconnect and refresh.
 */
export function useLiveStream<Path extends StreamPath>(
  target: MaybeRefOrGetter<LiveTarget<Path> | null>,
  options: LiveStreamOptions<Path>,
): LiveStream {
  const queryClient = options.cacheKey ? useQueryClient() : null;
  const paused = ref(false);
  /** `reconnect` bumps it, which reopens the stream. */
  const attempt = ref(0);
  const refresh = async () => {
    const queryKey = options.cacheKey?.();
    if (queryKey) await queryClient?.invalidateQueries({ queryKey });
  };
  const reconnect = () => {
    attempt.value += 1;
    void refresh();
  };
  const holder = createHolder(handlersOf(options, refresh), { paused, reconnect }, options);
  /** A string, so a target rebuilt with the same path and viewer does not reopen the stream. */
  const openKey = computed(() => {
    const next = toValue(target);
    return next ? `${pathOf(next)} ${next.viewer ?? ''}` : null;
  });
  watch(
    [openKey, attempt],
    () => {
      holder.close();
      paused.value = false;
      const next = toValue(target);
      if (next) holder.open(pathOf(next));
    },
    { immediate: true },
  );
  onScopeDispose(holder.close);
  return { paused: readonly(paused), reconnect, refresh, close: holder.close };
}
