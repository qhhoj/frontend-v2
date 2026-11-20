<script setup lang="ts">
import { Megaphone } from 'lucide-vue-next';
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import type { ContestProblem, CurrentParticipation } from '@/api/types/contests';
import CountdownTimer from '@/components/CountdownTimer.vue';
import { usePublishedHeight } from '@/features/problems/use-dock-height';
import { formatNumber, formatPoints } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import { useUnreadAnnouncementCount } from '../announcement-seen';
import { useContestQuery } from '../contests.queries';
import { ownResultContext, ownResultView } from '../own-result';
import { LETTER_CLASSES, LETTER_STATE_OF } from '../ranking-cell-classes';
import type { LetterState } from '../ranking-cell-classes';
import { isClockShownFor } from './header-clock';
import { participationKind } from './current-contest';

/**
 * The contest strip: a thin plate under the top of the page while the viewer is inside a running contest and reads a
 * problem or a submission of it. It answers "how long is left", "where am I" and "what is left to solve" without leaving
 * the statement: the contest's name (the way back), the countdown, my rank and score (the way to the board), my
 * submissions in this contest, unread announcements, and the problem letters with my state (filled = solved, a bar under
 * the letter = tried, an outline = the problem on screen). The letters are the one control that switches problems during
 * a run (the problem page draws no second list then). A phone keeps the countdown, the submissions link and the letters,
 * which scroll sideways.
 * On the contest's own tabs the plate already has the clock: while a `ContestHeader` shows it the strip steps aside
 * (`header-clock.ts`), so the clock shows once; pages of the contest without that header (print, balloons) keep the strip.
 * Shown by `AppShell` through `useCurrentContest`.
 */
const props = defineProps<{ current: CurrentParticipation }>();
const { t } = useI18n();
const route = useRoute();
const locale = useLocaleStore();
/** The impersonation banner is the one sticky strip above: the strip then scrolls away rather than slide under it. */
const session = useSessionStore();
const contestKey = computed(() => props.current.contest.key);
const kind = computed(() => participationKind(props.current.participation.virtual));
const statusText = computed(() => {
  if (kind.value === 'virtual')
    return t('contestBar.virtual', { run: props.current.participation.virtual });
  return t(kind.value === 'spectate' ? 'contestBar.spectate' : 'rail.live');
});
const unread = useUnreadAnnouncementCount(contestKey);
const isSteppedAside = computed(() => isClockShownFor(contestKey.value));
const root = ref<HTMLElement | null>(null);
/** Sticky things below it (the print toolbar) clear it through `--contest-bar-height`; gone, it publishes nothing. */
usePublishedHeight(root, '--contest-bar-height', () => true);

/** The problems and my result on each come from the contest's own answer, which the contest's pages already cache. */
const { data: contest } = useContestQuery(contestKey);
/** My place and score; none for a spectator, and no place while the board is frozen or shows only my row. */
const standing = computed(() => {
  const own = kind.value === 'spectate' ? null : props.current.standing;
  if (!own) return null;
  const score = t('contestBar.score', {
    score: formatPoints(own.score, locale.locale, contest.value?.pointsPrecision ?? 0),
  });
  return own.frozen || own.rank === null
    ? score
    : `${t('contestBar.rank', { rank: formatNumber(own.rank, locale.locale) })} · ${score}`;
});
const STATE_KEYS: Record<LetterState, string> = {
  solved: 'contestBar.letter.solved',
  partial: 'contestBar.letter.partial',
  failed: 'contestBar.letter.failed',
  pending: 'contestBar.letter.pending',
  none: 'contestBar.letter.none',
};
const stateOf = (problem: ContestProblem): LetterState => {
  if (!contest.value) return 'none';
  const view = ownResultView(problem, ownResultContext(contest.value, locale.locale));
  if (view.kind === 'cell') return LETTER_STATE_OF[view.cell.kind];
  if (view.kind === 'pending') return 'pending';
  return view.kind === 'attempted' ? 'failed' : 'none';
};
/** My submissions in this contest (a frequent check after a submit); a spectator has none. */
const ownSubmissions = computed(() =>
  kind.value === 'spectate' || !session.user
    ? null
    : {
        name: 'contest-submissions',
        params: { key: contestKey.value },
        query: { user: session.user.username },
      },
);
/** The problem page and its tabs (my submissions, all, best) are all "this problem". */
const isProblemRoute = computed(() => String(route.name).split('-')[0] === 'problem');
const letters = computed(() =>
  (contest.value?.problems ?? []).map((problem) => {
    const state = stateOf(problem);
    return {
      problem,
      state,
      title: `${problem.label}. ${problem.name}: ${t(STATE_KEYS[state])}`,
      isCurrent: isProblemRoute.value && route.params.code === problem.code,
    };
  }),
);
/** The letter of the problem on screen is always in view, also where the letters scroll sideways (a phone). */
watch(
  () => letters.value.find((letter) => letter.isCurrent)?.problem.problemId,
  async (currentId) => {
    if (!currentId) return;
    await nextTick();
    root.value
      ?.querySelector('[aria-current="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  },
  { immediate: true, flush: 'post' },
);
/** `inline-flex` is the base display, so `max-md:hidden` on a link still hides it on a touch screen. */
const QUIET_LINK = 'inline-flex items-center rounded-control hover:underline touch:min-h-11';
</script>

<template>
  <div
    v-if="!isSteppedAside"
    ref="root"
    role="group"
    :aria-label="$t('contestBar.label')"
    data-testid="contest-bar"
    :class="[
      'readout z-header rounded-none border-x-0 border-t-0 before:hidden after:hidden print:hidden',
      !session.impersonatorId && 'sticky top-0',
    ]"
  >
    <div class="page-gutter flex min-h-12 items-center gap-4 py-2 max-md:gap-2">
      <span class="eyebrow shrink-0 max-md:hidden">{{ statusText }}</span>
      <RouterLink
        :to="{ name: 'contest', params: { key: contestKey } }"
        :class="['min-w-0 gap-4 font-semibold max-md:shrink-0', QUIET_LINK]"
      >
        <span class="truncate max-md:sr-only">{{ current.contest.name }}</span>
        <span class="shrink-0 text-readout leading-none">
          <span class="sr-only">{{ $t('ranking.timeLeft') }}</span>
          <CountdownTimer
            :key="current.participation.endTime"
            :until="current.participation.endTime"
          />
        </span>
      </RouterLink>
      <RouterLink
        v-if="standing"
        :to="{ name: 'contest-ranking', params: { key: contestKey } }"
        data-testid="contest-bar-standing"
        :class="['eyebrow shrink-0 max-md:hidden', QUIET_LINK]"
        >{{ standing }}</RouterLink
      >
      <RouterLink
        v-if="ownSubmissions"
        :to="ownSubmissions"
        data-testid="contest-bar-submissions"
        :class="['eyebrow shrink-0', QUIET_LINK]"
        >{{ $t('contests.tabs.submissions') }}</RouterLink
      >
      <RouterLink
        v-if="unread > 0"
        :to="{ name: 'contest-announcements', params: { key: contestKey } }"
        data-testid="contest-bar-unread"
        :class="['shrink-0 gap-1.5 text-small font-semibold', QUIET_LINK]"
      >
        <Megaphone class="size-4" aria-hidden="true" />
        <span aria-hidden="true" class="font-mono tabular-nums">{{ unread }}</span>
        <span class="sr-only">{{
          $t('contests.announcements.unread', { count: unread }, unread)
        }}</span>
      </RouterLink>
      <nav
        v-if="letters.length"
        :aria-label="$t('contestBar.problems')"
        class="ml-auto min-w-0 overflow-x-auto"
      >
        <ul class="m-0 flex list-none items-center gap-1 p-1">
          <li v-for="letter in letters" :key="letter.problem.problemId" class="shrink-0">
            <RouterLink
              :to="{
                name: 'problem',
                params: { code: letter.problem.code },
                query: { contest: contestKey },
              }"
              :title="letter.title"
              :aria-current="letter.isCurrent ? 'true' : undefined"
              class="relative flex size-(--qh-control-sm) items-center justify-center rounded-control border font-mono text-small font-semibold hover:border-content aria-[current=true]:outline-2 aria-[current=true]:outline-offset-1 aria-[current=true]:outline-content touch:size-11"
              :class="LETTER_CLASSES[letter.state]"
            >
              <span aria-hidden="true">{{ letter.problem.label }}</span>
              <span class="sr-only">{{ letter.title }}</span>
            </RouterLink>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>
