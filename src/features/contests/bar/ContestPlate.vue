<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type {
  ContestDetail,
  CurrentParticipation,
  ParticipationSummary,
} from '@/api/types/contests';
import CountdownTimer from '@/components/CountdownTimer.vue';
import ContestTimeline from '@/components/ui/ContestTimeline.vue';
import Lamp from '@/components/ui/Lamp.vue';
import Readout from '@/components/ui/Readout.vue';
import ReadoutCell from '@/components/ui/ReadoutCell.vue';
import { parseSubmissionFilters } from '@/features/submissions/use-submission-filters';
import { useScopedSubmissionListQuery } from '@/features/submissions/submissions.queries';
import {
  LONG_COUNTDOWN_SECONDS,
  countdownTarget,
  freezeStart,
  ownEndTime,
} from '@/lib/contest-time';
import { formatElapsed, formatNumber, formatPoints } from '@/lib/format';
import { formatClock, formatDate } from '@/lib/format-date';
import { deltaTextClass, formatDelta } from '@/lib/rating-delta';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import { isOneDay, timelineLabels } from '../contest-clock';
import { useLengthText } from '../use-span-text';
import { boardFreezeOf } from './board-freeze';
import { timelineEvents, timelineTicks } from './plate-timeline';

/**
 * The contest's plate, under its header on every tab: what the clock and the judge measured. The big clock counts to the
 * start, then the time left (the viewer's own window or virtual run when they have one); an ended contest says when it
 * ended, at the size of the other cells (an ended contest needs less room than a running one). Beside it, only the cells
 * that have a value: my rank and score while I take part, the time to the freeze, the start and length before the contest
 * (the length alone after it: the end is already there), my rating after a rated contest with the change as a small signed
 * number, and the board's state in words ("Đóng băng", "Chờ công bố") last, on a line of its own on a phone. While time
 * runs the time scale shows the start, the end, now, the freeze zone and my submissions as lamps.
 * Colour: a state is neutral ink (the lamp of a running contest is the "in progress" blue, never the accepted green);
 * verdict colours are for results only, here the lamps of my submissions and the sign of my rating change.
 * `run`: the viewer's running participation here; `standing`: their rank and score in it.
 * `isBoardFrozen` is the board's own answer where the page has it (the ranking); elsewhere the contest decides.
 */
const props = withDefaults(
  defineProps<{
    contest: ContestDetail;
    run: ParticipationSummary | null;
    standing: CurrentParticipation['standing'];
    isBoardFrozen?: boolean;
  }>(),
  { isBoardFrozen: undefined },
);
const emit = defineEmits<{ elapsed: [] }>();
const { t } = useI18n();
const locale = useLocaleStore();
const session = useSessionStore();
const now = useNow();
const lengthText = useLengthText();

const virtualRun = computed(() => (props.run && props.run.virtual > 0 ? props.run : null));
const liveRun = computed(() => (props.run && props.run.virtual === 0 ? props.run : null));
/** What the big clock counts to, with the phase in words; null once the contest is over and no virtual run goes on. */
const clock = computed(() => {
  if (virtualRun.value)
    return {
      label: `${t('contestBar.virtual', { run: virtualRun.value.virtual })} · ${t('contests.plate.left')}`,
      until: virtualRun.value.endTime,
      isRunning: true,
    };
  const target = countdownTarget(props.contest, now.value);
  if (!target) return null;
  if (target.kind === 'start')
    return {
      label: `${t('contests.phase.upcoming')} · ${t('contests.plate.startsIn')}`,
      until: target.at,
      isRunning: false,
    };
  return {
    label: `${t('contests.phase.running')} · ${t('contests.plate.left')}`,
    until: ownEndTime(target.at, liveRun.value),
    isRunning: true,
  };
});
/** The target moved on (start to end, end to none): the page reads the contest again for its new phase. */
watch(
  () => clock.value?.until,
  () => emit('elapsed'),
);
/** Days and hours ("28 ngày 14 giờ") are words, not a clock: they take the word size. */
const isLongWait = computed(
  () =>
    clock.value !== null &&
    Date.parse(clock.value.until) - now.value >= LONG_COUNTDOWN_SECONDS * 1000,
);
const dateTime = (instant: string) => formatDate(instant, 'datetime', locale.locale);

/** My place and score: none for a spectator; the place also hides while the board is frozen or shows only my row. */
const own = computed(() => {
  const standing = props.standing;
  if (!standing || !props.run || props.run.virtual < 0) return null;
  const problems = props.contest.problems;
  const precision = props.contest.pointsPrecision;
  return {
    rank: standing.frozen || standing.rank === null ? null : standing.rank,
    score: formatPoints(standing.score, locale.locale, precision),
    fullScore: problems
      ? formatPoints(
          problems.reduce((sum, problem) => sum + problem.points, 0),
          locale.locale,
          precision,
        )
      : null,
  };
});
const userCount = computed(() => formatNumber(props.contest.userCount, locale.locale));

const freezeAt = computed(() => (virtualRun.value ? null : freezeStart(props.contest)));
/** Before the freeze: the time to it. From the freeze on: the board's state in words ("Đóng băng", "Chờ công bố"). */
const freezeIn = computed(() =>
  clock.value?.isRunning && freezeAt.value !== null && now.value < freezeAt.value
    ? new Date(freezeAt.value).toISOString()
    : null,
);
const freeze = computed(() =>
  virtualRun.value ? null : boardFreezeOf(props.contest, now.value, props.isBoardFrozen),
);
const freezeBody = computed(() =>
  freeze.value
    ? t(
        freeze.value.bodyKey,
        { minutes: props.contest.frozenLastMinutes },
        props.contest.frozenLastMinutes,
      )
    : '',
);

/** The start and the length stand in for the scale while no time runs; after the end the big cell already has the end, so only the length follows. */
const span = computed(() =>
  clock.value?.isRunning
    ? null
    : {
        start: clock.value ? dateTime(props.contest.startTime) : null,
        length: lengthText(
          (Date.parse(props.contest.endTime) - Date.parse(props.contest.startTime)) / 1000,
        ),
      },
);
/** My rating after the contest; the change is its result (up or down), so the signed number alone carries green or red. */
const ratingChange = computed(() => {
  const change = props.contest.viewer.ratingChange;
  if (!change) return null;
  return {
    rating: formatNumber(change.rating, locale.locale),
    delta: change.delta === null ? null : formatDelta(change.delta),
    deltaClass: deltaTextClass(change.delta),
  };
});
/** No value wraps inside its cell; on a phone a cell that holds words or a date takes the whole line instead. */
const CELL = 'whitespace-nowrap';
const WIDE_CELL = `${CELL} max-md:col-span-full`;

/** The scale runs over the viewer's virtual run when they have one, else over the contest while it runs. */
const scale = computed(() => {
  if (!clock.value?.isRunning) return null;
  const times = virtualRun.value
    ? { startTime: virtualRun.value.realStart, endTime: virtualRun.value.endTime }
    : props.contest;
  const start = Date.parse(times.startTime);
  const end = Date.parse(times.endTime);
  const ticks = timelineTicks(start, end, timelineLabels(times, locale.locale), isOneDay(times));
  return { start, end, ticks };
});
/** My submissions here, newest page: asked only while I take part, so a visitor's page adds no request. */
const username = computed(() => session.user?.username ?? null);
const takesPart = computed(
  () => scale.value !== null && props.run !== null && props.run.virtual >= 0,
);
const { data: submissions } = useScopedSubmissionListQuery(
  () => ({ kind: 'contest', key: props.contest.key, fixedUser: username.value }),
  ref(parseSubmissionFilters({})),
  () => takesPart.value && username.value !== null,
);
const events = computed(() => {
  if (!scale.value || !takesPart.value) return [];
  const { start, end } = scale.value;
  return timelineEvents(
    (submissions.value?.items ?? []).filter((submission) => {
      const at = Date.parse(submission.date);
      return at >= start && at <= end;
    }),
    props.contest.problems ?? [],
    start,
    ({ elapsed, problem, verdictKey }) =>
      t('contests.plate.event', { elapsed, problem, verdict: t(verdictKey) }),
  );
});
const freezeClock = computed(() =>
  freezeAt.value === null ? '' : formatClock(new Date(freezeAt.value).toISOString()),
);
/** One line under the scale says what its marks are; only the marks that are drawn are named. */
const scaleNote = computed(() =>
  [
    events.value.length > 0 ? t('contests.plate.eventsNote') : '',
    freezeAt.value === null ? '' : t('contests.plate.freezeNote', { time: freezeClock.value }),
  ]
    .filter(Boolean)
    .join(' '),
);
const nowLabel = computed(() =>
  scale.value
    ? t('contests.plate.now', {
        elapsed: formatElapsed(Math.max(0, now.value - scale.value.start) / 1000),
      })
    : undefined,
);
</script>

<template>
  <Readout :label="$t('contests.plate.label')" data-testid="contest-plate">
    <div class="flex flex-wrap items-end justify-between gap-x-12 gap-y-4">
      <ReadoutCell
        v-if="clock"
        :label="clock.label"
        :size="isLongWait ? 'word' : 'big'"
        :class="CELL"
        data-testid="contest-clock"
      >
        <template #label>
          <Lamp :tone="clock.isRunning ? 'pending' : 'none'" still class="shrink-0" />
          {{ clock.label }}
        </template>
        <span class="sr-only">{{ $t('ranking.timeLeft') }}</span>
        <CountdownTimer :key="clock.until" :until="clock.until" @elapsed="emit('elapsed')" />
      </ReadoutCell>
      <ReadoutCell
        v-else
        :label="$t('contests.phase.ended')"
        :class="CELL"
        data-testid="plate-ended"
      >
        <time :datetime="contest.endTime">{{ dateTime(contest.endTime) }}</time>
      </ReadoutCell>
      <div
        class="grid grid-cols-2 gap-x-12 gap-y-4 max-md:w-full max-md:gap-x-4 md:flex md:flex-wrap"
      >
        <template v-if="own">
          <ReadoutCell
            v-if="own.rank !== null"
            :label="$t('ranking.columns.rank')"
            :unit="virtualRun ? undefined : `/ ${userCount}`"
            data-testid="plate-rank"
          >
            {{ formatNumber(own.rank, locale.locale) }}
          </ReadoutCell>
          <ReadoutCell
            :label="$t('ranking.columns.score')"
            :unit="own.fullScore === null ? undefined : `/ ${own.fullScore}`"
            data-testid="plate-score"
          >
            {{ own.score }}
          </ReadoutCell>
        </template>
        <ReadoutCell v-if="freezeIn" :label="$t('contests.plate.freezeIn')" :class="CELL">
          <CountdownTimer :key="freezeIn" :until="freezeIn" />
        </ReadoutCell>
        <template v-if="span">
          <ReadoutCell v-if="span.start" :label="$t('contests.plate.start')" :class="WIDE_CELL">
            <time :datetime="contest.startTime">{{ span.start }}</time>
          </ReadoutCell>
          <ReadoutCell :label="$t('contests.plate.length')" :class="CELL">{{
            span.length
          }}</ReadoutCell>
        </template>
        <ReadoutCell
          v-if="ratingChange"
          :label="$t('contests.plate.rating')"
          :class="CELL"
          data-testid="viewer-rating-change"
        >
          {{ ratingChange.rating }}
          <template v-if="ratingChange.delta" #unit>
            <span :class="ratingChange.deltaClass">{{ ratingChange.delta }}</span>
          </template>
        </ReadoutCell>
        <ReadoutCell
          v-if="!freezeIn && freeze"
          :label="$t('contests.tabs.ranking')"
          size="word"
          :class="WIDE_CELL"
          :title="freezeBody"
          data-testid="freeze-chip"
        >
          {{ $t(freeze.labelKey) }}
          <span class="sr-only">{{ freezeBody }}</span>
        </ReadoutCell>
      </div>
    </div>
    <div v-if="scale" class="mt-4">
      <ContestTimeline
        :start="scale.start"
        :end="scale.end"
        :now="now"
        :freeze-at="freezeAt"
        :ticks="scale.ticks"
        :events="events"
        :label="$t('contests.plate.timeline')"
        :now-label="nowLabel"
        :freeze-label="
          freezeAt === null ? undefined : $t('contests.detail.freezeAt', { time: freezeClock })
        "
      />
      <p v-if="scaleNote" class="mt-2 text-small text-muted">{{ scaleNote }}</p>
    </div>
  </Readout>
</template>
