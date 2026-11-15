<script setup lang="ts">
import { computed } from 'vue';
import type { ContestDetail, ParticipationSummary } from '@/api/types/contests';
import Chip from '@/components/ui/Chip.vue';
import { phaseAt } from '@/lib/contest-time';
import { formatDelta } from '@/lib/rating-delta';
import { useNow } from '@/lib/use-now';
import ContestChips from './ContestChips.vue';
import { useContestTagsQuery } from './contest-extras.queries';
import ContestCountdown from './ContestCountdown.vue';
import ContestTimeBar from './ContestTimeBar.vue';

/**
 * What the problems tab shows under the contest's header, on the page background: tags, summary, the time bar while
 * time runs, the countdown to the start, and the viewer's rating change. The name, status, facts and actions are in
 * `ContestHeader`. `run`: the viewer's running participation here. While the header shows the clock (the contest runs, or
 * the viewer's virtual run does) the big countdown stays hidden but mounted: it still tells the page when a phase flips.
 */
const props = defineProps<{ contest: ContestDetail; run?: ParticipationSummary | null }>();
const virtualRun = computed(() => (props.run && props.run.virtual > 0 ? props.run : null));
const liveRun = computed(() => (props.run && props.run.virtual === 0 ? props.run : null));
/** The header colours its tags: read the catalogue only when the contest has tags. */
useContestTagsQuery(() => props.contest.tags.length > 0);
const emit = defineEmits<{ elapsed: [] }>();
/** One clock for the card: the pill, the bar and the countdown switch on the same second. */
const now = useNow();
const phase = computed(() => phaseAt(props.contest, now.value));
/** The header's clock: the same rule as `ContestHeader`. */
const isClockInHeader = computed(() => virtualRun.value !== null || phase.value === 'running');
/** An ended contest (no virtual run) needs no bar. */
const isEndedLine = computed(() => phase.value === 'ended' && virtualRun.value === null);
/** An ended contest with no tags, summary or rating change has nothing to show; the card stays mounted for the countdown. */
const hasContent = computed(
  () =>
    !isEndedLine.value ||
    props.contest.tags.length > 0 ||
    props.contest.organizations.length > 0 ||
    Boolean(props.contest.summary) ||
    Boolean(props.contest.viewer.ratingChange),
);
/** The viewer's own rating change once the contest's ratings are applied. */
const ratingChange = computed(() => props.contest.viewer.ratingChange);
const ratingChangeTone = computed(() => {
  const delta = ratingChange.value?.delta;
  if (!delta) return 'neutral';
  return delta > 0 ? 'success' : 'danger';
});
</script>

<template>
  <div
    v-show="hasContent"
    data-testid="contest-header"
    class="flex min-w-0 flex-col gap-(--space-stack)"
  >
    <div
      v-if="contest.tags.length || contest.organizations.length"
      class="flex flex-wrap items-center gap-1.5"
    >
      <ContestChips :contest="contest" only-tags />
    </div>
    <p v-if="contest.summary" class="hidden text-muted md:block">{{ contest.summary }}</p>
    <ContestTimeBar v-if="!isEndedLine" :contest="contest" :now="now" />
    <div v-show="!isClockInHeader && !isEndedLine">
      <ContestCountdown
        :contest="contest"
        :virtual-run="virtualRun"
        :live-run="liveRun"
        @elapsed="emit('elapsed')"
      />
    </div>
    <Chip
      v-if="ratingChange"
      data-testid="viewer-rating-change"
      size="md"
      :tone="ratingChangeTone"
      class="self-start font-mono tabular-nums"
    >
      {{
        ratingChange.delta === null
          ? $t('contests.detail.firstRating', { rating: ratingChange.rating })
          : $t('contests.detail.ratingChange', {
              change: `${formatDelta(ratingChange.delta)} → ${ratingChange.rating}`,
            })
      }}
    </Chip>
  </div>
</template>
