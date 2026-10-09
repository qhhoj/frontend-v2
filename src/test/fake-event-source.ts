import { vi } from 'vitest';

type Listener = (event: MessageEvent<string>) => void;

/** jsdom has no EventSource; tests push frames with `emit` and connection loss with `fail`. */
export class FakeEventSource {
  static readonly CLOSED = 2;
  static instances: FakeEventSource[] = [];
  readonly listeners = new Map<string, Listener[]>();
  closed = false;
  /** Like the browser: CLOSED (2) once the connection is gone for good, CONNECTING (0) while it retries. */
  readyState = 0;

  constructor(readonly url: string) {
    FakeEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: Listener) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  close() {
    this.closed = true;
    this.readyState = FakeEventSource.CLOSED;
  }

  /** Delivers one named event; `raw` sends `data` as-is instead of JSON. */
  emit(type: string, data: unknown, raw = false) {
    const event = new MessageEvent(type, { data: raw ? String(data) : JSON.stringify(data) });
    this.listeners.get(type)?.forEach((listener) => listener(event));
  }

  /** The connection broke; `retrying` keeps it CONNECTING (browser reconnects), otherwise the browser gave up (refused or closed by the server). */
  fail(retrying = false) {
    this.readyState = retrying ? 0 : FakeEventSource.CLOSED;
    this.emit('error', '', true);
  }
}

export function installFakeEventSource() {
  FakeEventSource.instances = [];
  vi.stubGlobal('EventSource', FakeEventSource);
}

const USER_STREAM_SUFFIX = '/events/user';
const isUserStream = (source: FakeEventSource) => source.url.endsWith(USER_STREAM_SUFFIX);
/** Every stream but the bell's per-user one, which each signed-in public page holds: page tests count these. */
export const pageStreams = () =>
  FakeEventSource.instances.filter((source) => !isUserStream(source));
/** The bell's newest `/events/user` stream, if one opened. */
export const userStream = () => FakeEventSource.instances.filter(isUserStream).at(-1);
export const latestEventSource = () => pageStreams().at(-1)!;
