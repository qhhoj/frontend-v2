<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import type { CurrentParticipation } from '@/api/types/contests';
import CountdownTimer from '@/components/CountdownTimer.vue';
import { navSectionOverride } from '@/features/shell/nav-section';
import { PHONE_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { useUnreadAnnouncementCount } from '../announcement-seen';
import { participationKind } from './current-contest';

/**
 * P-15 B: the one contest bar under the site header on every page while the viewer takes part in a contest. It answers
 * "how long is left", "where do I go back to" and "is there news" without leaving the statement. 48 px, 44 px on a phone,
 * where only the ranking and the announcements stay as links. Shown by `AppShell` through `useCurrentContest`.
 */
const props = defineProps<{ current: CurrentParticipation }>();
const { t } = useI18n();
const route = useRoute();
const contestKey = computed(() => props.current.contest.key);
const kind = computed(() => participationKind(props.current.participation.virtual));
const statusText = computed(() => {
  if (kind.value === 'virtual')
    return t('contestBar.virtual', { run: props.current.participation.virtual });
  return t(kind.value === 'spectate' ? 'contestBar.spectate' : 'contestBar.live');
});
const unread = useUnreadAnnouncementCount(contestKey);
/** A phone's 44 px bar abbreviates a multi-day clock (`28 ng 14 g`). */
const isPhone = useMediaQuery(PHONE_QUERY);

interface BarLink {
  name: string;
  label: string;
  /** The label a phone shows, when shorter. */
  shortLabel?: string;
  /** Only from `md` up: a phone keeps the two links the statement page has no other way to. */
  isWide?: boolean;
}
const LINKS = computed<BarLink[]>(() => [
  { name: 'contest', label: t('contests.tabs.problems'), isWide: true },
  { name: 'contest-submissions', label: t('contests.tabs.submissions'), isWide: true },
  {
    name: 'contest-ranking',
    label: t('contests.tabs.ranking'),
    shortLabel: t('contestBar.rankingShort'),
  },
  { name: 'contest-announcements', label: t('contests.tabs.announcements') },
]);
/** A page of this contest that is not a tab's own route: its problem lights "Đề bài", a submission "Bài nộp". */
const CLAIMED_BY: Record<string, string> = {
  problem: 'contest',
  submission: 'contest-submissions',
};
const currentLink = computed(() => {
  const name = String(route.name ?? '');
  if (route.params.key === contestKey.value) return name;
  return navSectionOverride.value === '/contests' ? (CLAIMED_BY[name] ?? null) : null;
});
const LINK =
  'relative inline-flex h-8 items-center gap-1.5 rounded-pill border border-transparent px-2.5 text-meta md:px-3 font-semibold whitespace-nowrap text-muted hover:bg-surface-hover hover:text-content aria-[current=page]:border-accent aria-[current=page]:bg-surface-solid aria-[current=page]:text-accent-soft-text pointer-coarse:after:absolute pointer-coarse:after:-inset-y-1.5 pointer-coarse:after:inset-x-0';
</script>

<template>
  <div
    data-testid="contest-bar"
    class="sticky top-0 z-header border-b border-line bg-accent-soft print:hidden"
  >
    <div class="page-gutter flex h-11 items-center gap-2 md:h-12 md:gap-3">
      <RouterLink
        :to="{ name: 'contest', params: { key: contestKey } }"
        class="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-accent-soft-text hover:underline"
      >
        <span aria-hidden="true" class="size-2 shrink-0 rounded-full bg-accent" />
        <span class="truncate"
          >{{ statusText }}<span class="hidden md:inline"> · {{ current.contest.name }}</span></span
        >
      </RouterLink>
      <p class="shrink-0 font-bold text-content">
        <span class="sr-only">{{ $t('ranking.timeLeft') }}</span>
        <CountdownTimer
          :key="current.participation.endTime"
          :until="current.participation.endTime"
          :short="isPhone"
        />
      </p>
      <nav :aria-label="$t('contestBar.label')" class="ml-auto shrink-0">
        <ul class="m-0 flex list-none items-center gap-0.5 p-0 md:gap-1">
          <li v-for="link in LINKS" :key="link.name" :class="link.isWide && 'hidden md:block'">
            <RouterLink
              :to="{ name: link.name, params: { key: contestKey } }"
              :aria-current="currentLink === link.name ? 'page' : 'false'"
              :class="LINK"
            >
              <template v-if="link.shortLabel">
                <span class="md:hidden">{{ link.shortLabel }}</span>
                <span class="hidden md:inline">{{ link.label }}</span>
              </template>
              <template v-else>{{ link.label }}</template>
              <span
                v-if="link.name === 'contest-announcements' && unread > 0"
                data-testid="contest-bar-unread"
                class="inline-flex min-w-5 items-center justify-center rounded-pill bg-accent px-1.5 text-tiny font-semibold text-on-accent tabular-nums"
              >
                <span aria-hidden="true">{{ unread }}</span>
                <span class="sr-only">{{
                  $t('contests.announcements.unread', { count: unread }, unread)
                }}</span>
              </span>
            </RouterLink>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>
