import { computed, onScopeDispose, ref } from 'vue';
import type { ComputedRef, Ref } from 'vue';

export const REPLAY_SPEEDS = [1, 10, 60, 300] as const;
export type ReplaySpeed = (typeof REPLAY_SPEEDS)[number];
/** The speed shown pressed. */
export const DEFAULT_REPLAY_SPEED: ReplaySpeed = 10;
/** Four board updates a second are enough even at x300. The clock moves by the real time between ticks, not by this. */
export const PLAYER_TICK_MS = 250;

export interface ReplayPlayer {
  seconds: Ref<number>;
  speed: Ref<ReplaySpeed>;
  isPlaying: Ref<boolean>;
  isFinished: ComputedRef<boolean>;
  play(): void;
  pause(): void;
  seek(seconds: number): void;
  setSpeed(speed: ReplaySpeed): void;
}

const clamp = (seconds: number, durationSeconds: number) =>
  Math.min(Math.max(seconds, 0), durationSeconds);

/**
 * The replay clock (seconds from each participation's start). Each tick adds `speed` × the wall time since the last one, so
 * a slow frame or a throttled background tab never slows playback. It runs under reduced motion too: only movement is cut.
 */
export function useReplayPlayer(durationSeconds: Ref<number>, startSeconds: number): ReplayPlayer {
  const seconds = ref(clamp(startSeconds, durationSeconds.value));
  const speed = ref<ReplaySpeed>(DEFAULT_REPLAY_SPEED);
  const isPlaying = ref(false);
  const isFinished = computed(() => seconds.value >= durationSeconds.value);
  let timer: ReturnType<typeof setInterval> | null = null;
  let lastTickAt = 0;

  function pause() {
    if (timer !== null) clearInterval(timer);
    timer = null;
    isPlaying.value = false;
  }
  function tick() {
    const now = performance.now();
    const elapsedMs = Math.max(now - lastTickAt, 0);
    lastTickAt = now;
    seconds.value = clamp(seconds.value + (speed.value * elapsedMs) / 1000, durationSeconds.value);
    if (isFinished.value) pause();
  }
  /** At the end, play starts over; a second play while playing changes nothing. */
  function play() {
    if (isPlaying.value) return;
    if (isFinished.value) seconds.value = 0;
    isPlaying.value = true;
    lastTickAt = performance.now();
    timer = setInterval(tick, PLAYER_TICK_MS);
  }
  const seek = (target: number) => {
    seconds.value = clamp(target, durationSeconds.value);
  };
  const setSpeed = (next: ReplaySpeed) => {
    speed.value = next;
  };
  onScopeDispose(pause);
  return { seconds, speed, isPlaying, isFinished, play, pause, seek, setSpeed };
}
