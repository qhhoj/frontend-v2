<script setup lang="ts">
import { computed } from 'vue';
import type { ContestListItem } from '@/api/types/contests';
import CountdownTimer from '@/components/CountdownTimer.vue';
import { CUE_TEXT } from '@/components/ui/cue-tones';
import StretchedLink from '@/components/ui/StretchedLink.vue';
import { formatLabel } from '@/lib/contest-format';
import { formatNumber } from '@/lib/format';
import { formatClock, formatDate, formatRelative } from '@/lib/format-date';
import { serverNow } from '@/lib/server-clock';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import ContestChips from './ContestChips.vue';
import ContestEditLink from './ContestEditLink.vue';
import { listCallToAction } from './contest-action';
import { useLengthText } from './use-span-text';
import ViewerBadge from './ViewerBadge.vue';

/**
 * One contest of the list as a ledger row, the same for all three groups: the name (the whole row opens the contest) with its
 * chips, then "date · length · format" in grey mono, then at the right the one fact that matters for the group, in its cue
 * colour: the time left (running), how long until it starts (upcoming), the contestant count (ended, grey). On a phone the facts and
 * the cue drop to a second line. Joining and the other calls are on the contest's own page.
 * `withEdit`: an organization's list, where its administrators get a pencil on the contests they edit.
 */
const props = defineProps<{
  contest: ContestListItem;
  phase: 'running' | 'upcoming' | 'ended';
  withEdit?: boolean;
  hideOrganizations?: boolean;
}>();
const locale = useLocaleStore();
const lengthOf = useLengthText();
/** The start words ("sau 5 ngày") move in minutes. */
const now = useNow(60_000);
const badgeKey = computed(() => listCallToAction(props.contest, serverNow()).badgeKey);
/** A running or upcoming contest says its time of day (and the year only when it is not this one); an ended one its full date. */
const dateText = computed(() =>
  props.phase === 'ended'
    ? formatDate(props.contest.startTime, 'date', locale.locale)
    : `${formatDate(props.contest.startTime, 'short', locale.locale)} ${formatClock(props.contest.startTime)}`,
);
const facts = computed(() => [
  dateText.value,
  lengthOf((Date.parse(props.contest.endTime) - Date.parse(props.contest.startTime)) / 1000),
  formatLabel(props.contest.formatName),
]);
/** Mid-phrase: ICU capitalises some words ("Ngày mai"), so the first letter is lowered. */
const startsInText = computed(() => {
  const text = formatRelative(props.contest.startTime, now.value, locale.locale);
  return text.charAt(0).toLowerCase() + text.slice(1);
});
const CUE_OF = { running: 'live', upcoming: 'upcoming', ended: 'ended' } as const;
</script>

<template>
  <li
    :data-testid="`${phase}-contest`"
    class="box-link flex min-h-(--qh-row) flex-wrap items-center gap-x-4 gap-y-0.5 border-b border-line py-2"
  >
    <div
      class="flex min-w-0 basis-full flex-wrap items-center gap-x-2 gap-y-1 md:flex-1 md:basis-0"
    >
      <StretchedLink
        :to="{ name: 'contest', params: { key: contest.key } }"
        :title="contest.name"
        class="max-w-full min-w-0 truncate font-semibold hover:text-accent-text"
        >{{ contest.name }}</StretchedLink
      >
      <ContestChips
        :contest="contest"
        with-tags
        with-code-needed
        hide-format
        :hide-organizations="hideOrganizations"
      />
      <ViewerBadge :badge-key="badgeKey" />
      <template v-if="withEdit">
        <span class="font-mono text-caption text-muted">{{ contest.key }}</span>
        <ContestEditLink :contest="contest" />
      </template>
    </div>
    <p class="min-w-0 flex-1 font-mono text-meta text-muted tabular-nums md:w-72 md:flex-none">
      {{ facts.join(' · ') }}
    </p>
    <p
      class="shrink-0 text-right text-meta whitespace-nowrap tabular-nums md:w-36"
      :class="CUE_TEXT[CUE_OF[phase]]"
      :data-cue="CUE_OF[phase]"
    >
      <i18n-t v-if="phase === 'running'" keypath="contests.list.timeLeft" tag="span">
        <template #span><CountdownTimer :until="contest.endTime" /></template>
      </i18n-t>
      <template v-else-if="phase === 'upcoming'">{{ startsInText }}</template>
      <template v-else
        ><span class="font-mono">{{
          $t('contests.list.contestantCount', {
            count: formatNumber(contest.userCount, locale.locale),
          })
        }}</span></template
      >
    </p>
  </li>
</template>
