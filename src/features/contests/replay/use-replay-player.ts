import { computed, onScopeDispose, ref } from 'vue';
import type { ComputedRef, Ref } from 'vue';

export const REPLAY_SPEEDS = [1, 10, 60, 300] as const;
export type ReplaySpeed = (typeof REPLAY_SPEEDS)[number];
/** The speed M2B shows pressed. */
export const DEFAULT_REPLAY_SPEED: ReplaySpeed = 10;
/** Four board updates a second are enough even at x300. */
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

/** The replay clock (seconds from each participation's start). It runs under reduced motion too: only movement is cut. */
export function useReplayPlayer(durationSeconds: Ref<number>, startSeconds: number): ReplayPlayer {
  const seconds = ref(clamp(startSeconds, durationSeconds.value));
  const speed = ref<ReplaySpeed>(DEFAULT_REPLAY_SPEED);
  const isPlaying = ref(false);
  const isFinished = computed(() => seconds.value >= durationSeconds.value);
  let timer: ReturnType<typeof setInterval> | null = null;

  function pause() {
    if (timer !== null) clearInterval(timer);
    timer = null;
    isPlaying.value = false;
  }
  function tick() {
    seconds.value = clamp(
      seconds.value + speed.value * (PLAYER_TICK_MS / 1000),
      durationSeconds.value,
    );
    if (isFinished.value) pause();
  }
  /** At the end, play starts over; a second play while playing changes nothing. */
  function play() {
    if (isPlaying.value) return;
    if (isFinished.value) seconds.value = 0;
    isPlaying.value = true;
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
