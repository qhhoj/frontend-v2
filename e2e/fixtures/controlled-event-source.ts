import type { Page } from '@playwright/test';

/**
 * A browser EventSource that never connects. The test pushes frames through `window.pushEvent` and drops the
 * connection for good through `window.closeStream` (readyState CLOSED, then an error), as a gone stream does.
 */
export const installControlledEventSource = (page: Page) =>
  page.addInitScript(() => {
    type Listener = (event: MessageEvent) => void;
    const streams: Array<{ readyState: number; listeners: Map<string, Listener[]> }> = [];
    class ControlledEventSource {
      static readonly CLOSED = 2;
      readonly listeners = new Map<string, Listener[]>();
      readyState = 1;
      constructor() {
        streams.push(this);
      }
      addEventListener(type: string, listener: Listener) {
        this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
      }
      close() {
        this.readyState = 2;
      }
    }
    Object.assign(window, {
      EventSource: ControlledEventSource,
      pushEvent: (type: string, data: unknown) =>
        streams
          .at(-1)
          ?.listeners.get(type)
          ?.forEach((listener) => listener(new MessageEvent(type, { data: JSON.stringify(data) }))),
      closeStream: () => {
        const stream = streams.at(-1);
        if (!stream) return;
        stream.readyState = 2;
        stream.listeners.get('error')?.forEach((listener) => listener(new MessageEvent('error')));
      },
    });
  });

/** Drops the open stream, as a browser does once it gives up reconnecting. */
export const closeStream = (page: Page) =>
  page.evaluate(() => (window as unknown as { closeStream: () => void }).closeStream());
