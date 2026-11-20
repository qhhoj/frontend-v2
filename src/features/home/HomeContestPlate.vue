<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { SubmissionListItem } from '@/api/types/submissions';
import CountdownTimer from '@/components/CountdownTimer.vue';
import EmptyState from '@/components/EmptyState.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AppButton from '@/components/ui/AppButton.vue';
import ContestTimeline from '@/components/ui/ContestTimeline.vue';
import type { TimelineEvent } from '@/components/ui/ContestTimeline.vue';
import Lamp from '@/components/ui/Lamp.vue';
import Readout from '@/components/ui/Readout.vue';
import ReadoutCell from '@/components/ui/ReadoutCell.vue';
import StretchedLink from '@/components/ui/StretchedLink.vue';
import { participationKind } from '@/features/contests/bar/current-contest';
import { listActionKind } from '@/features/contests/contest-action';
import type { ContestActionKind } from '@/features/contests/contest-action';
import { useLengthText } from '@/features/contests/use-span-text';
import { formatNumber } from '@/lib/format';
import { formatClock, formatDate } from '@/lib/format-date';
import { useNow } from '@/lib/use-now';
import { submissionVerdictOf } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import type { HomePlate } from './home-contests';

/**
 * The home's contest plate: the run the viewer is in (lamp and sentence, name, time left, own rank and score, the run
 * as a timeline with the viewer's submissions, "Vào làm bài"), a running contest they are not in ("Tham gia"), or the
 * next contest (time to its start, "Đăng ký"). The whole plate opens the contest; its buttons are links too, because
 * joining and registering ask for the rules and the access code on the contest page. With no contest at all it is one
 * line with Bit. `readOnly` (a visitor) leaves the buttons out: the page's primary is then "Đăng ký" of the account.
 */
const props = defineProps<{
  plate: HomePlate;
  loading: boolean;
  error: unknown;
  /** The viewer's recent submissions: those of the run are the timeline's lamps. */
  submissions?: readonly SubmissionListItem[];
  readOnly?: boolean;
}>();
const emit = defineEmits<{ retry: []; elapsed: [] }>();

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;
/** How often the clock is read again, in milliseconds. */
const CLOCK_INTERVAL = 30_000;
const CONTESTS = { name: 'contests' };
/** What the viewer already did in a contest they are not in now, said after the phase. */
const DONE_KEYS: Partial<Record<ContestActionKind, string>> = {
  registered: 'contests.list.badges.registered',
  finished: 'contests.list.badges.finished',
};
/** The plate's primary by the contest page's action; every other action has no button here. */
const PRIMARY_KEYS: Partial<Record<ContestActionKind, string>> = {
  join: 'home.plate.join',
  rejoin: 'home.plate.enter',
  leave: 'home.plate.enter',
  register: 'contests.actions.register',
};

const { t } = useI18n();
const locale = useLocaleStore();
const now = useNow(CLOCK_INTERVAL);
const lengthText = useLengthText();
const format = (value: number) => formatNumber(value, locale.locale);

const mine = computed(() => (props.plate.kind === 'mine' ? props.plate.current : null));
const listed = computed(() => (props.plate.kind === 'none' ? null : props.plate.contest));
const runKind = computed(() =>
  mine.value ? participationKind(mine.value.participation.virtual) : null,
);
/** The times the plate measures: the viewer's own run (a window or a virtual run starts when they did), else the contest. */
const times = computed(() => {
  if (mine.value) {
    const { contest, participation } = mine.value;
    const isWholeContest = runKind.value !== 'virtual' && participation.endTime === contest.endTime;
    return {
      key: contest.key,
      name: contest.name,
      start: Date.parse(isWholeContest ? contest.startTime : participation.realStart),
      runStart: Date.parse(participation.realStart),
      end: Date.parse(participation.endTime),
      until: participation.endTime,
    };
  }
  if (!listed.value) return null;
  const { key, name, startTime, endTime } = listed.value;
  const start = Date.parse(startTime);
  return {
    key,
    name,
    start,
    runStart: start,
    end: Date.parse(endTime),
    until: props.plate.kind === 'upcoming' ? startTime : endTime,
  };
});
const isUpcoming = computed(() => props.plate.kind === 'upcoming');
const action = computed(() =>
  listed.value && !mine.value && !props.readOnly ? listActionKind(listed.value, now.value) : null,
);
const sentence = computed(() => {
  if (runKind.value === 'spectate') return t('contestBar.spectate');
  if (runKind.value === 'virtual')
    return t('contestBar.virtual', { run: mine.value?.participation.virtual });
  if (runKind.value === 'live') return t('home.plate.mine');
  const phase = t(isUpcoming.value ? 'home.plate.upcoming' : 'home.plate.running');
  const done = action.value ? DONE_KEYS[action.value] : undefined;
  return done ? `${phase} · ${t(done)}` : phase;
});
const length = computed(() => {
  if (!listed.value) return null;
  const seconds =
    listed.value.timeLimit ??
    (Date.parse(listed.value.endTime) - Date.parse(listed.value.startTime)) / 1000;
  return lengthText(seconds);
});
/** "IOI · 3:00"; the length is its own reading on an upcoming plate. */
const formatLine = computed(() => {
  if (!listed.value) return '';
  const name = t(`formats.${listed.value.formatName}`);
  return isUpcoming.value || !length.value ? name : `${name} · ${length.value}`;
});
/** Never a stale figure: a spectator has no standing, and on a frozen board the rank and the score are left out. */
const standing = computed(() => {
  const own = runKind.value === 'spectate' ? null : (mine.value?.standing ?? null);
  return own && !own.frozen ? own : null;
});
const primaryKey = computed(() => {
  if (mine.value) return 'home.plate.enter';
  return action.value ? (PRIMARY_KEYS[action.value] ?? null) : null;
});
/** "23/11 14:00": the day and the time a coming contest starts at. */
const startText = computed(() =>
  times.value
    ? `${formatDate(times.value.start, 'short', locale.locale)} ${formatClock(times.value.start)}`
    : '',
);
const clockLabel = (at: number) =>
  times.value && times.value.end - times.value.start >= MS_PER_DAY
    ? formatDate(at, 'short', locale.locale)
    : formatClock(at);
const ticks = computed(() =>
  times.value
    ? [times.value.start, times.value.end].map((at) => ({ at, label: clockLabel(at) }))
    : [],
);
/** The viewer's submissions of this run, placed by the minute the scoreboard counts them at. */
const events = computed<TimelineEvent[]>(() => {
  const run = times.value;
  if (!mine.value || !run) return [];
  return (props.submissions ?? []).flatMap((item) => {
    const minute = item.contest?.key === run.key ? item.contest.minute : null;
    if (minute === null || minute === undefined) return [];
    const verdict = submissionVerdictOf(item);
    return [
      {
        at: run.runStart + minute * MS_PER_MINUTE,
        tone: verdict.tone,
        label: `${item.problem?.name ?? ''}: ${t(verdict.labelKey)}`,
      },
    ];
  });
});
</script>

<template>
  <div data-testid="home-plate">
    <QueryState :loading="loading" :error="error" @retry="emit('retry')">
      <template #skeleton>
        <Readout as="div" class="flex h-full flex-col justify-between gap-4">
          <p class="eyebrow"><SkeletonBlock text class="w-48" /></p>
          <p class="text-readout-word leading-tight"><SkeletonBlock text class="w-2/3" /></p>
          <p class="text-score leading-none"><SkeletonBlock text class="w-48" /></p>
          <div class="h-14" />
        </Readout>
      </template>
      <EmptyState v-if="!times" inline data-testid="home-no-contest">
        {{ $t('home.plate.none') }}
        <template #action>
          <AppButton tone="link" class="text-meta" :to="CONTESTS">{{ $t('home.browseContests') }}</AppButton>
        </template>
      </EmptyState>
      <Readout
        v-else
        :label="$t('home.plate.label')"
        data-testid="live-contest"
        class="box-link flex h-full flex-col justify-between gap-4"
      >
        <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <p class="flex items-center gap-2 eyebrow">
            <Lamp :tone="isUpcoming ? 'none' : 'ac'" />{{ sentence }}
          </p>
          <p v-if="formatLine" class="eyebrow">{{ formatLine }}</p>
        </div>
        <h2 class="font-display text-readout-word leading-tight font-bold">
          <StretchedLink
            :to="{ name: 'contest', params: { key: times.key } }"
            class="text-content"
            >{{ times.name }}</StretchedLink
          >
        </h2>
        <div class="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <ReadoutCell
            :label="$t(isUpcoming ? 'home.plate.startsIn' : 'home.plate.timeLeft')"
            size="big"
          >
            <CountdownTimer :key="times.until" :until="times.until" @elapsed="emit('elapsed')" />
          </ReadoutCell>
          <div class="flex flex-col gap-4 sm:ml-auto sm:items-end">
            <div class="flex gap-6">
              <template v-if="standing">
                <ReadoutCell
                  v-if="standing.rank !== null"
                  data-testid="live-standing"
                  :label="$t('home.plate.rank')"
                >
                  {{ format(standing.rank) }}
                  <span v-if="listed" class="text-muted">/ {{ format(listed.userCount) }}</span>
                </ReadoutCell>
                <ReadoutCell :label="$t('home.plate.score')">{{
                  format(standing.score)
                }}</ReadoutCell>
              </template>
              <template v-else-if="isUpcoming && listed">
                <ReadoutCell :label="$t('home.plate.start')">{{ startText }}</ReadoutCell>
                <ReadoutCell :label="$t('home.plate.length')">{{ length }}</ReadoutCell>
              </template>
              <ReadoutCell v-else-if="listed && !mine" :label="$t('home.plate.contestants')">{{
                format(listed.userCount)
              }}</ReadoutCell>
            </div>
            <div v-if="mine || primaryKey" class="flex flex-wrap items-center gap-2">
              <AppButton
                v-if="mine"
                :to="{ name: 'contest-ranking', params: { key: times.key } }"
                >{{ $t('contestBar.rankingShort') }}</AppButton
              >
              <AppButton
                v-if="primaryKey"
                tone="primary"
                :to="{ name: 'contest', params: { key: times.key } }"
                >{{ $t(primaryKey) }}</AppButton
              >
            </div>
          </div>
        </div>
        <ContestTimeline
          v-if="!isUpcoming"
          :start="times.start"
          :end="times.end"
          :now="now"
          :ticks="ticks"
          :events="events"
          :label="$t('home.plate.timeline')"
          :now-label="$t('home.plate.now', { time: formatClock(now) })"
        />
      </Readout>
    </QueryState>
  </div>
</template>
