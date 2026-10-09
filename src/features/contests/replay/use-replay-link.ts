import { watch } from 'vue';
import type { Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { parseReplaySeconds } from './replay-seconds';
import type { ReplayPlayer } from './use-replay-player';

/**
 * `?t=` (whole seconds) both ways: read once when the replay's length is known; written with `replace` (never a new history
 * entry) when playback pauses or ends, and on a seek while paused. Never while playing.
 */
export function useReplayLink(player: ReplayPlayer, durationSeconds: Ref<number>) {
  const route = useRoute();
  const router = useRouter();
  let hasReadLink = false;
  watch(
    durationSeconds,
    (duration) => {
      if (hasReadLink || duration <= 0) return;
      hasReadLink = true;
      player.seek(parseReplaySeconds(route.query.t, duration));
    },
    { immediate: true },
  );
  const writeLink = () =>
    void router.replace({ query: { ...route.query, t: String(Math.floor(player.seconds.value)) } });
  watch(player.isPlaying, (isPlaying) => {
    if (!isPlaying) writeLink();
  });
  const seek = (seconds: number) => {
    player.seek(seconds);
    if (!player.isPlaying.value) writeLink();
  };
  return { seek };
}
