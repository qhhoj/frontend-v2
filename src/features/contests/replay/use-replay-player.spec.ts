import { afterEach, describe, expect, it, vi } from 'vitest';
import { effectScope, ref } from 'vue';
import { PLAYER_TICK_MS, useReplayPlayer } from './use-replay-player';

const start = (durationSeconds: number, startSeconds = 0) => {
  const scope = effectScope();
  const player = scope.run(() => useReplayPlayer(ref(durationSeconds), startSeconds))!;
  return { scope, player };
};

describe('useReplayPlayer', () => {
  afterEach(() => vi.useRealTimers());

  it('moves the clock by speed times the elapsed time while playing, and holds it on pause', () => {
    vi.useFakeTimers({ toFake: ['performance', 'Date', 'setInterval', 'clearInterval'] });
    const { scope, player } = start(10_800);
    player.setSpeed(60);
    player.play();
    vi.advanceTimersByTime(2000);
    expect(player.seconds.value).toBe(120);
    player.pause();
    vi.advanceTimersByTime(5000);
    expect(player.seconds.value).toBe(120);
    expect(player.isPlaying.value).toBe(false);
    scope.stop();
  });

  it('keeps real-time speed when a tick comes late (a slow frame or a throttled tab)', () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const now = vi.spyOn(performance, 'now').mockReturnValue(10_000);
    const { scope, player } = start(10_800);
    player.setSpeed(60);
    player.play();
    now.mockReturnValue(12_000);
    vi.advanceTimersByTime(PLAYER_TICK_MS);
    expect(player.seconds.value).toBe(120);
    now.mockRestore();
    scope.stop();
  });

  it('stops exactly at the end and starts over when played again', () => {
    vi.useFakeTimers({ toFake: ['performance', 'Date', 'setInterval', 'clearInterval'] });
    const { scope, player } = start(100, 90);
    player.setSpeed(300);
    player.play();
    vi.advanceTimersByTime(PLAYER_TICK_MS);
    expect([player.seconds.value, player.isPlaying.value, player.isFinished.value]).toEqual([
      100,
      false,
      true,
    ]);
    player.play();
    expect(player.seconds.value).toBe(0);
    expect(player.isPlaying.value).toBe(true);
    scope.stop();
  });

  it('clamps a seek into the replay and keeps playing through it', () => {
    vi.useFakeTimers({ toFake: ['performance', 'Date', 'setInterval', 'clearInterval'] });
    const { scope, player } = start(100);
    player.play();
    player.seek(-20);
    expect(player.seconds.value).toBe(0);
    player.seek(5000);
    expect(player.seconds.value).toBe(100);
    player.seek(42.9);
    expect(player.seconds.value).toBe(42.9);
    scope.stop();
  });

  it('stops ticking when the page goes away', () => {
    vi.useFakeTimers({ toFake: ['performance', 'Date', 'setInterval', 'clearInterval'] });
    const { scope, player } = start(10_800);
    player.play();
    scope.stop();
    vi.advanceTimersByTime(5000);
    expect(player.seconds.value).toBe(0);
  });
});
