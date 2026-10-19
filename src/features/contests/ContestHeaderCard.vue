<script setup lang="ts">
import { computed } from 'vue';
import type { ContestDetail, ParticipationSummary } from '@/api/types/contests';
import Card from '@/components/ui/Card.vue';
import Chip from '@/components/ui/Chip.vue';
import UserLink from '@/components/UserLink.vue';
import { phaseAt, spanMessage } from '@/lib/contest-time';
import { formatNumber } from '@/lib/format';
import { formatWeekdayDate } from '@/lib/format-date';
import { formatDelta } from '@/lib/rating-delta';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import ContestChips from './ContestChips.vue';
import { isOneDay } from './contest-clock';
import { useContestTagsQuery } from './contest-extras.queries';
import ContestCountdown from './ContestCountdown.vue';
import ContestTimeBar from './ContestTimeBar.vue';
import PhasePill from './PhasePill.vue';

/**
 * `run`: the viewer's running participation here. The contest bar then carries the clock, so a phone drops the big
 * countdown (P-17 A); a virtual run's countdown counts the run's own time (P-19).
 */
const props = defineProps<{ contest: ContestDetail; run?: ParticipationSummary | null }>();
const virtualRun = computed(() => (props.run && props.run.virtual > 0 ? props.run : null));
/** The header colours its tags: read the catalogue only when the contest has tags. */
useContestTagsQuery(() => props.contest.tags.length > 0);
const emit = defineEmits<{ elapsed: [] }>();
const locale = useLocaleStore();
/** One clock for the card: the pill, the bar and the countdown switch on the same second. */
const now = useNow();
const phase = computed(() => phaseAt(props.contest, now.value));
const startMs = computed(() => Date.parse(props.contest.startTime));
const lengthSpan = computed(() =>
  spanMessage((Date.parse(props.contest.endTime) - startMs.value) / 1000),
);
const elapsedSpan = computed(() =>
  phase.value === 'running' ? spanMessage((now.value - startMs.value) / 1000) : null,
);
/** The viewer's own rating change once the contest's ratings are applied (P-22, Q-06 A). */
const ratingChange = computed(() => props.contest.viewer.ratingChange);
const ratingChangeTone = computed(() => {
  const delta = ratingChange.value?.delta;
  if (!delta) return 'neutral';
  return delta > 0 ? 'success' : 'danger';
});
/** The day, when the bar's labels carry clocks only (a one-day contest); otherwise they already carry the dates. */
const oneDay = computed(() =>
  isOneDay(props.contest) ? formatWeekdayDate(props.contest.startTime, locale.locale) : null,
);
</script>

<template>
  <Card
    data-testid="contest-header"
    class="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] md:p-6"
  >
    <div class="flex min-w-0 flex-col gap-3">
      <div class="flex flex-wrap items-center gap-1.5">
        <PhasePill :phase="phase" />
        <ContestChips :contest="contest" with-tags />
      </div>
      <div>
        <h1 class="flex items-center gap-3 page-title tracking-tight">
          <img
            v-if="contest.logoOverrideImage"
            :src="contest.logoOverrideImage"
            alt=""
            class="size-10 shrink-0 rounded-cell object-contain md:size-14"
          />
          {{ contest.name }}
        </h1>
        <p v-if="contest.summary" class="mt-1 hidden text-muted md:block">
          {{ contest.summary }}
        </p>
        <p class="mt-1 hidden text-sm text-muted md:block">
          <template v-if="contest.authors.length">
            {{ $t('contests.detail.authors') }}
            <template v-for="(author, index) in contest.authors" :key="author.id"
              >{{ index ? ', ' : '' }}<UserLink :username="author.username" :rating="author.rating"
            /></template>
            ·
          </template>
          {{
            $t(
              'contests.participants',
              { count: formatNumber(contest.userCount, locale.locale) },
              contest.userCount,
            )
          }}
        </p>
      </div>
      <ContestTimeBar :contest="contest" :now="now" />
      <p class="text-sm text-muted">
        <template v-if="oneDay">{{ oneDay }} · </template>
        {{ $t(lengthSpan.key, lengthSpan.params, lengthSpan.count ?? 1) }}
        <template v-if="elapsedSpan">
          ·
          {{
            $t('contests.detail.elapsed', {
              span: $t(elapsedSpan.key, elapsedSpan.params, elapsedSpan.count ?? 1),
            })
          }}
        </template>
      </p>
    </div>
    <div
      :class="['flex flex-col gap-4', virtualRun && 'rounded-row border border-line-accent p-4']"
    >
      <ContestCountdown
        :contest="contest"
        :virtual-run="virtualRun"
        :class="run && 'max-md:hidden'"
        @elapsed="emit('elapsed')"
      />
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
      <slot name="actions" />
    </div>
  </Card>
</template>
