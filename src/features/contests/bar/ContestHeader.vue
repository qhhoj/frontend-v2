<script setup lang="ts">
import { Printer, Snowflake, Timer } from 'lucide-vue-next';
import { computed } from 'vue';
import type { ContestDetail, ContestPhase } from '@/api/types/contests';
import CountdownTimer from '@/components/CountdownTimer.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import Chip from '@/components/ui/Chip.vue';
import type { MenuEntry } from '@/components/ui/Menu.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import ShortLinkButton from '@/features/short-links/ShortLinkButton.vue';
import { shortLinkPath } from '@/features/short-links/short-link-path';
import UserLink from '@/components/UserLink.vue';
import { formatLabel } from '@/lib/contest-format';
import { ownEndTime, phaseAt, spanMessage } from '@/lib/contest-time';
import { formatNumber } from '@/lib/format';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import { useI18n } from 'vue-i18n';
import { useNow } from '@/lib/use-now';
import ContestActions from '../ContestActions.vue';
import ContestTabs from '../ContestTabs.vue';
import { boardFreezeOf } from './board-freeze';
import { useShownClock } from './header-clock';
import { useCurrentContest } from './use-current-contest';

/**
 * The contest bar on the contest's own pages: the one H1 (the name), the phase and format chips, the clock while time runs, the
 * freeze chip beside the clock, and the contest's tabs. `ContestLayout` renders it once for every tab, so the state sits in one place and
 * the layout does not jump between tabs. The shell's `ContestBar` steps aside while this header shows the clock
 * (`header-clock.ts`), so the clock shows once and never zero times. The clock counts what the viewer's own time is: a virtual run's end, else the end of their live
 * window, else the contest's end; it shows only while that time runs.
 * `isBoardFrozen` is the board's own answer where the page has it (the ranking); elsewhere `viewer.boardFrozenAt` decides.
 */
const props = withDefaults(
  defineProps<{
    contestKey: string;
    contest?: ContestDetail;
    isBoardFrozen?: boolean;
    /** The tab to light on a page that is not a tab's own route. */
    current?: string;
  }>(),
  /** Absent is "the page has no board", not false (Vue casts a missing boolean prop to false). */
  { contest: undefined, isBoardFrozen: undefined, current: undefined },
);
const emit = defineEmits<{ elapsed: [] }>();
const now = useNow();
const { current: participation } = useCurrentContest();
/** The viewer's running participation here (live, virtual or spectating), or null. */
const run = computed(() =>
  participation.value?.contest.key === props.contestKey ? participation.value.participation : null,
);
const phase = computed(() => (props.contest ? phaseAt(props.contest, now.value) : undefined));
const clockUntil = computed(() => {
  const contest = props.contest;
  if (!contest) return null;
  if (run.value && run.value.virtual > 0) return run.value.endTime;
  if (phase.value !== 'running') return null;
  return ownEndTime(contest.endTime, run.value?.virtual === 0 ? run.value : null);
});
useShownClock(
  () => props.contestKey,
  () => clockUntil.value !== null,
);
/** The status is a dot and a word; the rest is plain muted text after it: virtual run, format, rated, who may enter. */
const PHASE_DOT: Record<ContestPhase, string> = {
  running: 'bg-positive',
  upcoming: 'bg-accent',
  ended: 'bg-line-strong',
};
const { t } = useI18n();
const locale = useLocaleStore();
const facts = computed(() => {
  const contest = props.contest;
  if (!contest) return [];
  const privacy = contest.isPrivate
    ? t('contests.private')
    : contest.isOrganizationPrivate
      ? t('contests.organizationPrivate')
      : null;
  return [
    run.value && run.value.virtual > 0 ? t('contestBar.virtual', { run: run.value.virtual }) : null,
    formatLabel(contest.formatName),
    contest.isRated ? t('contests.rated') : null,
    privacy,
  ].filter((fact): fact is string => fact !== null);
});
/** The contest's length and start, the one time fact the header carries (the clock and the bar say the rest). */
const timeFact = computed(() => {
  const contest = props.contest;
  if (!contest) return '';
  const span = spanMessage((Date.parse(contest.endTime) - Date.parse(contest.startTime)) / 1000);
  const start = formatDate(contest.startTime, 'datetime', locale.locale);
  return `${start} (${t(span.key, span.params, span.count ?? 1)})`;
});
/** "In tất cả đề" sits in the header's "⋯" menu while the statements are listed. */
const overflow = computed<MenuEntry[]>(() =>
  props.contest?.problems
    ? [
        {
          label: t('contests.problems.printAll'),
          icon: Printer,
          to: { name: 'contest-all', params: { key: props.contestKey } },
        },
      ]
    : [],
);
const freeze = computed(() =>
  props.contest ? boardFreezeOf(props.contest, now.value, props.isBoardFrozen) : null,
);
</script>

<template>
  <div data-testid="contest-page-header">
    <PageHeader v-if="contest" :title="contest.name" :overflow="overflow">
      <template v-if="contest.logoOverrideImage" #start>
        <img
          :src="contest.logoOverrideImage"
          alt=""
          class="size-8 shrink-0 rounded-cell object-contain"
        />
      </template>
      <template #meta>
        <span v-if="phase" class="inline-flex items-center gap-1.5 font-semibold text-content">
          <span aria-hidden="true" :class="['size-2 rounded-pill', PHASE_DOT[phase]]" />{{
            $t(`contests.phase.${phase}`)
          }}
        </span>
        <template v-for="fact in [...facts, timeFact]" :key="fact">
          <span aria-hidden="true">·</span>
          <span>{{ fact }}</span>
        </template>
        <span aria-hidden="true">·</span>
        <span>{{
          $t(
            'contests.participants',
            { count: formatNumber(contest.userCount, locale.locale) },
            contest.userCount,
          )
        }}</span>
        <template v-if="contest.authors.length">
          <span aria-hidden="true" class="hidden md:inline">·</span>
          <span class="hidden md:inline">
            {{ $t('contests.detail.authors') }}
            <template v-for="(author, index) in contest.authors" :key="author.id"
              >{{ index ? ', ' : '' }}<UserLink :username="author.username" :rating="author.rating"
            /></template>
          </span>
        </template>
      </template>
      <template #actions>
        <span
          v-if="freeze"
          data-testid="freeze-chip"
          :title="
            $t(freeze.bodyKey, { minutes: contest.frozenLastMinutes }, contest.frozenLastMinutes)
          "
        >
          <Chip tone="info" :icon="Snowflake">{{ $t(freeze.labelKey) }}</Chip>
          <span class="sr-only">{{
            $t(freeze.bodyKey, { minutes: contest.frozenLastMinutes }, contest.frozenLastMinutes)
          }}</span>
        </span>
        <p
          v-if="clockUntil"
          data-testid="contest-clock"
          class="flex items-center gap-1.5 text-subtitle leading-none font-semibold tabular-nums"
        >
          <Timer class="size-4 text-muted" aria-hidden="true" />
          <span class="sr-only">{{ $t('ranking.timeLeft') }}</span>
          <CountdownTimer :key="clockUntil" :until="clockUntil" @elapsed="emit('elapsed')" />
        </p>
        <!-- Capped from `md`: a note under the button (virtual run, spectating) wraps instead of widening the column over the title. -->
        <ContestActions
          :contest="contest"
          :current="participation"
          class="md:max-w-80 md:items-end md:text-right"
        />
        <ShortLinkButton compact :path="shortLinkPath({ kind: 'contest', key: contest.key })" />
      </template>
      <template #tabs>
        <ContestTabs :contest-key="contestKey" :phase="contest.phase" :current="current" />
      </template>
    </PageHeader>
    <template v-else>
      <div data-skeleton-region="title" class="page-title">
        <SkeletonBlock text class="w-80 max-w-full" />
      </div>
      <div class="mt-3"><ContestTabs :contest-key="contestKey" :current="current" /></div>
    </template>
  </div>
</template>
