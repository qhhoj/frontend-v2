import { useQueryClient } from '@tanstack/vue-query';
import { ref } from 'vue';
import { deliverBalloon, undeliverBalloon } from '@/api/balloons.api';
import type { Balloon } from '@/api/types/contest-ops';
import { useViewerId } from '@/stores/use-viewer-id';
import { balloonRowId, isDelivered } from './balloon-queue';

/**
 * Deliver or undo one balloon. One write at a time (a double click sends one request); after any answer, success or refusal
 * (`already_delivered` by another volunteer, `balloon_not_found` after a rescore), the queue is read again.
 */
export function useBalloonDelivery(contestKey: () => string) {
  const queryClient = useQueryClient();
  const viewer = useViewerId();
  const busyId = ref<string | null>(null);
  const failure = ref<unknown>(null);
  async function toggle(balloon: Balloon) {
    if (busyId.value !== null) return;
    busyId.value = balloonRowId(balloon);
    failure.value = null;
    try {
      const write = isDelivered(balloon) ? undeliverBalloon : deliverBalloon;
      await write(contestKey(), balloon);
    } catch (error) {
      failure.value = error;
    } finally {
      busyId.value = null;
      await queryClient.invalidateQueries({
        queryKey: ['contests', 'balloons', viewer.value, contestKey()],
      });
    }
  }
  return { toggle, busyId, failure };
}
