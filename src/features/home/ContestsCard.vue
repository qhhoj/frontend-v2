<script setup lang="ts">
import { computed } from 'vue';
import type { ContestListItem } from '@/api/types/contests';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AppButton from '@/components/ui/AppButton.vue';
import Chip from '@/components/ui/Chip.vue';
import PageSection from '@/components/ui/PageSection.vue';
import StretchedLink from '@/components/ui/StretchedLink.vue';
import { listActionKind } from '@/features/contests/contest-action';
import { useLengthText, useSpanText } from '@/features/contests/use-span-text';
import { spanMessage } from '@/lib/contest-time';
import { formatClock, formatDate } from '@/lib/format-date';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';

/**
 * The contests under the plate (both homes): the other running ones, then the coming ones, one row each, a link as a
 * whole: name, start and length, and for a signed-in viewer "Đăng ký" (a link: the contest page asks for the rules and
 * the access code) or the "Đã đăng ký" tag. The page reads the lists once and leaves out the plate's contest. With no
 * row the section is not drawn: the plate, or its one line, already says so.
 */
const props = defineProps<{
  running: readonly ContestListItem[];
  upcoming: readonly ContestListItem[];
  loading: boolean;
  signedIn?: boolean;
}>();
const locale = useLocaleStore();
const now = useNow(30_000);
const spanText = useSpanText();
const lengthText = useLengthText();
const secondsBetween = (from: number, to: string) => (Date.parse(to) - from) / 1000;
const timeLeftOf = (contest: ContestListItem) =>
  spanText(spanMessage(secondsBetween(now.value, contest.endTime)));
/** "23/11 · 14:00 · 1:30": the day, the time and the length. */
const whenOf = (contest: ContestListItem) =>
  [
    formatDate(contest.startTime, 'short', locale.locale),
    formatClock(contest.startTime),
    lengthText(contest.timeLimit ?? secondsBetween(Date.parse(contest.startTime), contest.endTime)),
  ].join(' · ');
const actionOf = (contest: ContestListItem) =>
  props.signedIn ? listActionKind(contest, now.value) : null;
const linkOf = (contest: ContestListItem) => ({ name: 'contest', params: { key: contest.key } });
const hasRows = computed(() => props.running.length + props.upcoming.length > 0);
const ROW = 'flex min-h-(--qh-row) items-center gap-3 px-2 touch:min-h-13';
const NAME = 'block min-w-0 truncate font-medium text-content sm:flex-1';
const TEXT = 'min-w-0 flex-1 sm:flex sm:items-center sm:gap-3';
const META = 'shrink-0 font-mono text-small text-muted tabular-nums';
</script>

<template>
  <PageSection
    v-if="loading || hasRows"
    data-testid="contests-card"
    :title="$t(running.length ? 'home.otherContests' : 'home.upcomingContests')"
    :see-all="{ to: { name: 'contests' }, label: $t('home.allContests') }"
  >
    <ul v-if="loading" aria-hidden="true" class="flex flex-col divide-y divide-line">
      <li v-for="row in 2" :key="row" :class="ROW">
        <span class="min-w-0 flex-1"><SkeletonBlock text class="w-1/2" /></span>
        <SkeletonBlock text class="w-32" />
      </li>
    </ul>
    <ul v-else class="flex flex-col divide-y divide-line">
      <li
        v-for="contest in running"
        :key="contest.key"
        data-testid="running-row"
        class="box-link"
        :class="ROW"
      >
        <span :class="TEXT">
          <StretchedLink :to="linkOf(contest)" :class="NAME">{{ contest.name }}</StretchedLink>
        </span>
        <Chip tone="live" dot>{{
          $t('contests.list.timeLeft', { span: timeLeftOf(contest) })
        }}</Chip>
      </li>
      <li
        v-for="contest in upcoming"
        :key="contest.key"
        data-testid="upcoming-row"
        class="box-link"
        :class="ROW"
      >
        <span :class="TEXT">
          <StretchedLink :to="linkOf(contest)" :class="NAME">{{ contest.name }}</StretchedLink>
          <span :class="META">{{ whenOf(contest) }}</span>
        </span>
        <AppButton v-if="actionOf(contest) === 'register'" size="sm" :to="linkOf(contest)">{{
          $t('contests.actions.register')
        }}</AppButton>
        <Chip v-else-if="actionOf(contest) === 'registered'">{{
          $t('contests.list.badges.registered')
        }}</Chip>
      </li>
    </ul>
  </PageSection>
</template>
