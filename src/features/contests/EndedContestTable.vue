<script setup lang="ts">
import type { ContestListItem } from '@/api/types/contests';
import ScrollRegion from '@/components/ScrollRegion.vue';
import { spanMessage } from '@/lib/contest-time';
import { formatNumber, formatShortDate } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import ContestCallLink from './ContestCallLink.vue';
import ContestChips from './ContestChips.vue';
import ContestOrganizationChips from './ContestOrganizationChips.vue';
import { listCallToAction } from './contest-action';
import {
  ENDED_CELL,
  ENDED_HEAD_ROW_CLASS,
  ENDED_ROW_CLASS,
  ENDED_TABLE_CLASS,
} from './ended-columns';
import { useSpanText } from './use-span-text';
import ViewerBadge from './ViewerBadge.vue';

defineProps<{
  contests: ContestListItem[];
  /** The list is one organization's: its name is not repeated on every row. */
  isOrganizationScoped?: boolean;
}>();
const locale = useLocaleStore();
const spanText = useSpanText();
/** Ended rows do not change with the clock, so each render reads it once. */
const callOf = (contest: ContestListItem) => listCallToAction(contest, Date.now());
/** The start date and the length, in one cell: `04/10 · 4 giờ`. */
const whenText = (contest: ContestListItem) => {
  const lengthSeconds = (Date.parse(contest.endTime) - Date.parse(contest.startTime)) / 1000;
  return `${formatShortDate(contest.startTime, locale.locale)} · ${spanText(spanMessage(lengthSeconds))}`;
};
</script>

<template>
  <ScrollRegion
    data-testid="ended-contests"
    :label="$t('contests.list.endedRegion')"
    class="glass overflow-hidden rounded-card"
  >
    <table :class="ENDED_TABLE_CLASS">
      <caption class="sr-only">
        {{
          $t('contests.phase.ended')
        }}
      </caption>
      <thead>
        <tr :class="ENDED_HEAD_ROW_CLASS">
          <th scope="col" class="font-semibold" :class="ENDED_CELL.name">
            {{ $t('contests.list.columns.contest') }}
          </th>
          <th scope="col" class="font-semibold" :class="ENDED_CELL.when">
            {{ $t('contests.list.columns.when') }}
          </th>
          <th scope="col" class="font-semibold" :class="ENDED_CELL.format">
            {{ $t('contests.list.columns.format') }}
          </th>
          <th scope="col" class="font-semibold" :class="ENDED_CELL.participants">
            {{ $t('contests.list.columns.participants') }}
          </th>
          <th scope="col" :class="ENDED_CELL.action">
            <span class="sr-only">{{ $t('contests.list.columns.action') }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="contest in contests" :key="contest.key" :class="ENDED_ROW_CLASS">
          <th scope="row" class="text-left font-normal" :class="ENDED_CELL.name">
            <RouterLink
              :to="{ name: 'contest', params: { key: contest.key } }"
              class="font-semibold hover:text-accent-text"
              >{{ contest.name }}</RouterLink
            >
            <span class="block font-mono text-[12.5px] text-muted">{{ contest.key }}</span>
            <span
              v-if="!isOrganizationScoped && contest.organizations.length"
              class="mt-1 flex max-w-full flex-wrap gap-1.5"
              ><ContestOrganizationChips :contest="contest"
            /></span>
          </th>
          <td class="whitespace-nowrap" :class="ENDED_CELL.when">{{ whenText(contest) }}</td>
          <td :class="ENDED_CELL.format">
            <span class="flex flex-wrap gap-1.5">
              <ContestChips :contest="contest" with-tags with-code-needed hide-organizations />
              <ViewerBadge :badge-key="callOf(contest).badgeKey" />
            </span>
          </td>
          <td class="font-mono tabular-nums" :class="ENDED_CELL.participants">
            {{ formatNumber(contest.userCount, locale.locale) }}
            <span v-if="contest.virtualCount" class="block text-[12.5px] text-muted">{{
              $t('contests.virtualExtra', {
                count: formatNumber(contest.virtualCount, locale.locale),
              })
            }}</span>
          </td>
          <td :class="ENDED_CELL.action">
            <ContestCallLink
              :contest-key="contest.key"
              :contest-name="contest.name"
              :label-key="callOf(contest).labelKey"
              :is-primary="callOf(contest).isPrimary"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </ScrollRegion>
</template>
