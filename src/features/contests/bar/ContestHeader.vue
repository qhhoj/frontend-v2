<script setup lang="ts">
import { Ellipsis, Lock, Printer, Timer } from 'lucide-vue-next';
import { computed, provide, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { ContestDetail } from '@/api/types/contests';
import CountdownTimer from '@/components/CountdownTimer.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import Chip from '@/components/ui/Chip.vue';
import IconButton from '@/components/ui/IconButton.vue';
import Menu from '@/components/ui/Menu.vue';
import type { MenuEntry } from '@/components/ui/Menu.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { CURRENT_SECTION_KEY } from '@/components/ui/page-section';
import ShortLinkButton from '@/features/short-links/ShortLinkButton.vue';
import { shortLinkPath } from '@/features/short-links/short-link-path';
import UserLink from '@/components/UserLink.vue';
import { formatLabel } from '@/lib/contest-format';
import { ownEndTime, phaseAt } from '@/lib/contest-time';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useI18n } from 'vue-i18n';
import { useNow } from '@/lib/use-now';
import AnnouncementsPausedNotice from '../AnnouncementsPausedNotice.vue';
import ContestActions from '../ContestActions.vue';
import ContestChips from '../ContestChips.vue';
import { useContestTagsQuery } from '../contest-extras.queries';
import ContestTabs from '../ContestTabs.vue';
import ContestPlate from './ContestPlate.vue';
import { useShownClock } from './header-clock';
import { usePublishedHeight } from '@/features/problems/use-dock-height';
import { useSessionStore } from '@/stores/session.store';
import { useCurrentContest } from './use-current-contest';

/**
 * The head of the contest's own pages: the eyebrow (format, rated), the one H1 (the name), the facts that are not
 * measurements (tags, access code, participants, authors), the viewer's actions, the plate (`ContestPlate`: clock, rank,
 * score, freeze, time scale) and the contest's tabs. `ContestLayout` renders it once for every tab, so the state sits in
 * one place and the layout does not jump between tabs. The shell's `ContestBar` steps aside while the plate shows the
 * clock (`header-clock.ts`), so the clock shows once and never zero times. The clock counts what the viewer's own time
 * is: a virtual run's end, else the end of their live window, else the contest's end.
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
const { t } = useI18n();
const locale = useLocaleStore();
/**
 * One eyebrow line over the name ("Kỳ thi · ICPC · Tính rating"): the section (the way back to the list), the viewer's
 * virtual run when one goes on, the format, and "rated" when it is. The header's own section crumb would be a second
 * line saying "Kỳ thi" again, so the header inside gets no section.
 */
provide(CURRENT_SECTION_KEY, ref(null));
const eyebrow = computed(() => {
  const contest = props.contest;
  if (!contest) return '';
  return [
    run.value && run.value.virtual > 0 ? t('contestBar.virtual', { run: run.value.virtual }) : null,
    formatLabel(contest.formatName),
    contest.isRated ? t('contests.rated') : null,
  ]
    .filter(Boolean)
    .join(' · ');
});
/** The tag chips read their colours from the catalogue: asked only when the contest has tags. */
useContestTagsQuery(() => (props.contest?.tags.length ?? 0) > 0);
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
</script>

<template>
  <div ref="root" data-testid="contest-page-header" class="contents">
    <PageHeader
      v-if="contest"
      :title="contest.name"
      :lead="contest.summary || undefined"
      beside-from="xl"
    >
      <template v-if="contest.logoOverrideImage" #start>
        <img
          :src="contest.logoOverrideImage"
          alt=""
          class="size-8 shrink-0 rounded-cell object-contain"
        />
      </template>
      <template #above>
        <p class="eyebrow" data-testid="contest-eyebrow">
          <RouterLink
            :to="{ name: 'contests' }"
            class="hover:text-content hover:underline max-md:hidden"
            >{{ $t('nav.contests') }}</RouterLink
          >
          <span class="md:hidden">{{ $t('nav.contests') }}</span>
          · {{ eyebrow }}
        </p>
      </template>
      <template #meta>
        <ContestChips
          v-if="contest.tags.length || contest.organizations.length"
          :contest="contest"
          only-tags
        />
        <Chip v-if="contest.requiresAccessCode" tone="attention" :icon="Lock">{{
          $t('contests.list.codeNeeded')
        }}</Chip>
        <span>{{
          $t(
            'contests.participants',
            { count: formatNumber(contest.userCount, locale.locale) },
            contest.userCount,
          )
        }}</span>
        <template v-if="contest.authors.length">
          <span aria-hidden="true" class="max-md:hidden">·</span>
          <span class="max-md:hidden">
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
      <template v-if="showsActions" #actions>
        <!-- Under `xl` the actions are one row under the title; from `xl` a column beside it, capped so a note wraps instead of widening it over the title. -->
        <ContestActions
          :contest="contest"
          :current="participation"
          class="max-xl:flex-row max-xl:flex-wrap max-xl:items-center xl:max-w-80 xl:items-end xl:text-right"
        />
      </template>
    </PageHeader>
    <ContestPlate
      v-if="contest"
      :contest="contest"
      :run="run"
      :standing="run ? (participation?.standing ?? null) : null"
      :is-board-frozen="isBoardFrozen"
      @elapsed="emit('elapsed')"
    />
    <div
      v-if="contest"
      ref="strip"
      role="group"
      :aria-label="$t('contestBar.sticky.label')"
      data-testid="contest-sticky-bar"
      :class="[
        'z-header flex items-center gap-3 print:static',
        isSticky && 'sticky top-0 bg-ground',
      ]"
    >
      <div class="min-w-0 flex-1">
        <ContestTabs
          :is-pinned="isPinned"
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
        <span class="max-w-xs truncate max-md:hidden">{{ contest.name }}</span>
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
      <ContestTabs :contest-key="contestKey" :current="current" />
    </template>
  </div>
</template>
