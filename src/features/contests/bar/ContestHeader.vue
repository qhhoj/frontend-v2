<script setup lang="ts">
import { Ellipsis, Lock, Printer, Snowflake, Timer } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { ContestDetail, ContestPhase } from '@/api/types/contests';
import CountdownTimer from '@/components/CountdownTimer.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import Chip from '@/components/ui/Chip.vue';
import type { CueTone } from '@/components/ui/cue-tones';
import IconButton from '@/components/ui/IconButton.vue';
import Menu from '@/components/ui/Menu.vue';
import type { MenuEntry } from '@/components/ui/Menu.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import ShortLinkButton from '@/features/short-links/ShortLinkButton.vue';
import { shortLinkPath } from '@/features/short-links/short-link-path';
import UserLink from '@/components/UserLink.vue';
import { formatLabel } from '@/lib/contest-format';
import { ownEndTime, phaseAt } from '@/lib/contest-time';
import { formatNumber } from '@/lib/format';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import { useI18n } from 'vue-i18n';
import { useNow } from '@/lib/use-now';
import AnnouncementsPausedNotice from '../AnnouncementsPausedNotice.vue';
import ContestActions from '../ContestActions.vue';
import ContestTabs from '../ContestTabs.vue';
import { boardFreezeOf } from './board-freeze';
import { useShownClock } from './header-clock';
import { usePublishedHeight } from '@/features/problems/use-dock-height';
import { useSessionStore } from '@/stores/session.store';
import { useCurrentContest } from './use-current-contest';
import { useLengthText } from '../use-span-text';

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
const route = useRoute();
/**
 * The join, virtual and register buttons sit on the contest's main tab only. A viewer who is in the contest keeps the
 * status line ("Rời kỳ thi") on every tab: the leave button has no other home while the header shows the clock.
 */
const showsActions = computed(() => route.name === 'contest' || run.value !== null);
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
/** The status is a filled chip with its dot: running green, upcoming blue, ended grey. The rest of the line is plain muted text. */
const PHASE_TONE: Record<ContestPhase, CueTone> = {
  running: 'live',
  upcoming: 'upcoming',
  ended: 'ended',
};
const { t } = useI18n();
const locale = useLocaleStore();
const lengthText = useLengthText();
interface Fact {
  text: string | null;
  wideOnly: boolean;
}
const facts = computed<(Fact & { text: string })[]>(() => {
  const contest = props.contest;
  if (!contest) return [];
  /** Under `md` only the format stays: the rest moves to the rules fold-out and the ranking tab. */
  const all: Fact[] = [
    {
      text:
        run.value && run.value.virtual > 0
          ? t('contestBar.virtual', { run: run.value.virtual })
          : null,
      wideOnly: true,
    },
    { text: formatLabel(contest.formatName), wideOnly: false },
    { text: contest.isRated ? t('contests.rated') : null, wideOnly: false },
  ];
  return all.filter((fact): fact is Fact & { text: string } => fact.text !== null);
});
/** The contest's start and length, the one time fact the header carries (the clock and the bar say the rest). Phones show the length only. */
const timeFact = computed(() => {
  const contest = props.contest;
  if (!contest) return null;
  const length = lengthText((Date.parse(contest.endTime) - Date.parse(contest.startTime)) / 1000);
  return { start: formatDate(contest.startTime, 'datetime', locale.locale), length };
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
/**
 * While time runs the tabs sit in a sticky strip that outlives the header: the contest's tabs stay one tap away and,
 * once the header's own clock has scrolled off the top, the strip carries the name and the clock, so the clock shows once.
 * The strip is a sibling of the `PageHeader` (the header root is `display: contents`), so it sticks across the page column.
 * Under impersonation the banner is the one sticky strip above; the strip then scrolls with the page.
 */
const isPinned = computed(() => clockUntil.value !== null);
const session = useSessionStore();
const isSticky = computed(() => isPinned.value && !session.impersonatorId);
const root = ref<HTMLElement | null>(null);
const strip = ref<HTMLElement | null>(null);
const isHeaderClockAbove = ref(false);
watch(
  [root, clockUntil],
  ([container], _previous, onCleanup) => {
    const clock = container?.querySelector('[data-testid="contest-clock"]');
    isHeaderClockAbove.value = false;
    if (!clock) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry)
        isHeaderClockAbove.value = !entry.isIntersecting && entry.boundingClientRect.top < 0;
    });
    observer.observe(clock);
    onCleanup(() => observer.disconnect());
  },
  { flush: 'post' },
);
const showsStripClock = computed(() => isSticky.value && isHeaderClockAbove.value);
/** Sticky things below the strip (the ranking's table head) clear it through `--contest-bar-height`; it publishes only while it sticks. */
usePublishedHeight(
  computed(() => (isSticky.value ? strip.value : null)),
  '--contest-bar-height',
  () => true,
);
const freeze = computed(() =>
  props.contest ? boardFreezeOf(props.contest, now.value, props.isBoardFrozen) : null,
);
</script>

<template>
  <div ref="root" data-testid="contest-page-header" class="contents">
    <PageHeader v-if="contest" :title="contest.name" beside-from="xl">
      <template v-if="contest.logoOverrideImage" #start>
        <img
          :src="contest.logoOverrideImage"
          alt=""
          class="size-8 shrink-0 rounded-cell object-contain"
        />
      </template>
      <template #meta>
        <Chip v-if="phase" :tone="PHASE_TONE[phase]" dot>{{ $t(`contests.phase.${phase}`) }}</Chip>
        <template v-for="fact in facts" :key="fact.text">
          <span aria-hidden="true" :class="fact.wideOnly && 'max-md:hidden'">·</span>
          <span :class="fact.wideOnly && 'max-md:hidden'">{{ fact.text }}</span>
        </template>
        <span aria-hidden="true">·</span>
        <template v-if="timeFact">
          <span class="max-md:hidden">{{ timeFact.start }} ({{ timeFact.length }})</span>
          <span class="md:hidden">{{ timeFact.length }}</span>
        </template>
        <Chip
          v-if="contest.requiresAccessCode"
          tone="attention"
          :icon="Lock"
          class="max-md:hidden"
          >{{ $t('contests.list.codeNeeded') }}</Chip
        >
        <span aria-hidden="true" class="max-md:hidden">·</span>
        <span class="max-md:hidden">{{
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
      <template #titleTools>
        <Menu v-if="overflow.length > 0" :items="overflow" :label="$t('common.moreActions')">
          <template #trigger="{ toggle, open, setOpener }">
            <IconButton
              :ref="(el) => setOpener((el as { $el?: HTMLElement } | null)?.$el ?? null)"
              tone="secondary"
              :label="$t('nav.more')"
              aria-haspopup="menu"
              :aria-expanded="open"
              data-testid="page-header-overflow"
              @click="toggle"
            >
              <Ellipsis aria-hidden="true" />
            </IconButton>
          </template>
        </Menu>
        <ShortLinkButton compact :path="shortLinkPath({ kind: 'contest', key: contest.key })" />
      </template>
      <template v-if="freeze || clockUntil || showsActions" #actions>
        <span
          v-if="freeze"
          data-testid="freeze-chip"
          :title="
            $t(freeze.bodyKey, { minutes: contest.frozenLastMinutes }, contest.frozenLastMinutes)
          "
        >
          <Chip tone="attention" :icon="Snowflake">{{ $t(freeze.labelKey) }}</Chip>
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
        <!-- Under `xl` the actions are one row under the title; from `xl` a column beside it, capped so a note wraps instead of widening it over the title. -->
        <ContestActions
          v-if="showsActions"
          :contest="contest"
          :current="participation"
          class="max-xl:flex-row max-xl:flex-wrap max-xl:items-center xl:max-w-80 xl:items-end xl:text-right"
        />
      </template>
      <template v-if="!isPinned" #tabs>
        <ContestTabs :contest-key="contestKey" :phase="contest.phase" :current="current" />
      </template>
    </PageHeader>
    <div
      v-if="contest && isPinned"
      ref="strip"
      role="group"
      :aria-label="$t('contestBar.sticky.label')"
      data-testid="contest-sticky-bar"
      :class="[
        'z-header -mt-3 flex items-center gap-3 bg-surface py-1 md:-mt-2 print:static',
        isSticky && 'sticky top-0',
      ]"
    >
      <div class="min-w-0 flex-1">
        <ContestTabs
          is-pinned
          :contest-key="contestKey"
          :phase="contest.phase"
          :current="current"
        />
      </div>
      <div
        v-if="showsStripClock && clockUntil"
        data-testid="contest-sticky-status"
        class="flex min-w-0 shrink-0 items-center gap-2 text-meta font-semibold"
      >
        <span aria-hidden="true" class="size-2 shrink-0 rounded-full bg-cue-live" />
        <span class="max-w-xs truncate text-cue-live max-md:hidden">{{ contest.name }}</span>
        <span class="flex items-center gap-1.5 tabular-nums">
          <Timer class="size-4 text-muted" aria-hidden="true" />
          <span class="sr-only">{{ $t('ranking.timeLeft') }}</span>
          <CountdownTimer :key="clockUntil" :until="clockUntil" />
        </span>
      </div>
    </div>
    <AnnouncementsPausedNotice v-if="contest && isPinned" :contest-key="contestKey" />
    <template v-if="!contest">
      <div data-skeleton-region="title" class="page-title">
        <SkeletonBlock text class="w-80 max-w-full" />
      </div>
      <div class="mt-3"><ContestTabs :contest-key="contestKey" :current="current" /></div>
    </template>
  </div>
</template>
