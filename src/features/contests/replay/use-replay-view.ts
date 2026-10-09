import { computed, ref, watch } from 'vue';
import type { Ref } from 'vue';
import type { ContestDetail } from '@/api/types/contests';
import type { Locale } from '@/i18n';
import { showsCellTime } from '@/lib/ranking-cells';
import type { RankingContext } from '@/lib/ranking-cells';
import { useLocaleStore } from '@/stores/locale.store';
import type { ReplayPanelState } from './replay-bits';
import { indexReplay } from './replay-board';
import { replayDurationSeconds } from './replay-seconds';
import { replayViewState } from './replay-state';
import type { ReplayViewState } from './replay-state';
import { timelineOf } from './replay-timeline';
import { useReplayQuery } from './replay.queries';

const isPanelState = (state: ReplayViewState): state is ReplayPanelState =>
  state !== 'ready' && state !== 'loading';

/** How a contest prints cells and scores; the same rules as the ranking page. */
export const rankingContextOf = (
  contest: ContestDetail | undefined,
  locale: Locale,
): RankingContext => ({
  formatName: contest?.formatName ?? 'default',
  pointsPrecision: contest?.pointsPrecision ?? 0,
  locale,
  showsTime: contest ? showsCellTime(contest.formatName, contest.formatConfig) : false,
});

/** True once the state has been `building`, so the page announces "ready" only after a wait. */
function useWasBuilding(state: Ref<ReplayViewState>): Ref<boolean> {
  const wasBuilding = ref(false);
  watch(
    state,
    (next) => {
      if (next === 'building') wasBuilding.value = true;
    },
    { immediate: true },
  );
  return wasBuilding;
}

/** The replay of one contest as a page reads it: its state, the indexed rows, the timeline and the clock's length. */
export function useReplayView(key: Ref<string>, contest: Ref<ContestDetail | undefined>) {
  const locale = useLocaleStore();
  const isReadable = computed(
    () => contest.value?.phase === 'ended' && contest.value.formatName !== 'final_submission',
  );
  const query = useReplayQuery(key, isReadable);
  const state = computed<ReplayViewState>(() =>
    contest.value
      ? replayViewState({
          contest: contest.value,
          isPending: query.isPending.value,
          error: query.error.value,
          load: query.data.value,
        })
      : 'loading',
  );
  const wasBuilding = useWasBuilding(state);
  const load = query.data;
  const index = computed(() =>
    load.value?.state === 'ready' ? indexReplay(load.value.replay) : null,
  );
  const timeline = computed(() => (index.value ? timelineOf(index.value) : []));
  const durationSeconds = computed(() =>
    contest.value ? replayDurationSeconds(contest.value, timeline.value.at(-1)?.event[0] ?? 0) : 0,
  );
  return {
    state,
    panelState: computed(() => (isPanelState(state.value) ? state.value : null)),
    wasBuilding,
    index,
    timeline,
    durationSeconds,
    context: computed(() => rankingContextOf(contest.value, locale.locale)),
    refetch: () => void query.refetch(),
  };
}
