import { beforeEach, describe, expect, it, vi } from 'vitest';
import { installFakeEventSource, latestEventSource } from '@/test/fake-event-source';
import { openEventStream } from './events';

describe('openEventStream', () => {
  beforeEach(installFakeEventSource);

  it('opens the internal API path and hands parsed data to the named handler', () => {
    const onState = vi.fn();
    const onDone = vi.fn();
    openEventStream('/events/submissions/abc', { state: onState, done: onDone });
    expect(latestEventSource().url).toBe('/api/internal/events/submissions/abc');
    latestEventSource().emit('state', { status: 'QU' });
    expect(onState).toHaveBeenCalledWith({ status: 'QU' });
    expect(onDone).not.toHaveBeenCalled();
  });

  it('skips a frame that is not JSON', () => {
    const onState = vi.fn();
    openEventStream('/events/submissions/abc', { state: onState });
    latestEventSource().emit('state', '{broken', true);
    expect(onState).not.toHaveBeenCalled();
  });

  it('skips a frame whose JSON is not an object', () => {
    const onState = vi.fn();
    openEventStream('/events/submissions/abc', { state: onState });
    latestEventSource().emit('state', 'null', true);
    latestEventSource().emit('state', '"text"', true);
    expect(onState).not.toHaveBeenCalled();
  });

  it('closes the connection', () => {
    openEventStream('/events/submissions/abc', {}).close();
    expect(latestEventSource().closed).toBe(true);
  });

  it('reports a connection the browser gave up on, but not one it is retrying', () => {
    const onClosed = vi.fn();
    openEventStream('/events/submissions/abc', {}, onClosed);
    latestEventSource().fail(true);
    expect(onClosed).not.toHaveBeenCalled();
    latestEventSource().fail();
    expect(onClosed).toHaveBeenCalledOnce();
  });
});
