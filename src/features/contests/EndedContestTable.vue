<script setup lang="ts">
import type { ContestListItem } from '@/api/types/contests';
import { spanMessage } from '@/lib/contest-time';
import { formatNumber, formatShortDate } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import ContestCallLink from './ContestCallLink.vue';
import ContestChips from './ContestChips.vue';
import { listCallToAction } from './contest-action';
import { useSpanText } from './use-span-text';
import ViewerBadge from './ViewerBadge.vue';

defineProps<{ contests: ContestListItem[] }>();
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
  <div
    data-testid="ended-contests"
    tabindex="0"
    role="region"
    :aria-label="$t('contests.list.endedRegion')"
    class="glass overflow-x-auto rounded-card focus-visible:-outline-offset-2"
  >
    <table class="w-full min-w-[640px] border-collapse text-sm">
      <caption class="sr-only">
        {{
          $t('contests.phase.ended')
        }}
      </caption>
      <thead>
        <tr class="text-left text-[12px] tracking-wider text-muted uppercase">
          <th scope="col" class="px-5 py-3 font-semibold">
            {{ $t('contests.list.columns.contest') }}
          </th>
          <th scope="col" class="px-3 py-3 font-semibold">
            {{ $t('contests.list.columns.when') }}
          </th>
          <th scope="col" class="px-3 py-3 font-semibold">
            {{ $t('contests.list.columns.format') }}
          </th>
          <th scope="col" class="px-3 py-3 text-right font-semibold">
            {{ $t('contests.list.columns.participants') }}
          </th>
          <th scope="col" class="px-5 py-3">
            <span class="sr-only">{{ $t('contests.list.columns.action') }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="contest in contests" :key="contest.key" class="border-t border-line">
          <th scope="row" class="px-5 py-3 text-left font-normal">
            <RouterLink
              :to="{ name: 'contest', params: { key: contest.key } }"
              class="font-semibold hover:text-accent-text"
              >{{ contest.name }}</RouterLink
            >
            <span class="block font-mono text-[12.5px] text-muted">{{ contest.key }}</span>
          </th>
          <td class="px-3 py-3 whitespace-nowrap">{{ whenText(contest) }}</td>
          <td class="px-3 py-3">
            <span class="flex flex-wrap gap-1.5">
              <ContestChips :contest="contest" with-code-needed />
              <ViewerBadge :badge-key="callOf(contest).badgeKey" />
            </span>
          </td>
          <td class="px-3 py-3 text-right font-mono tabular-nums">
            {{ formatNumber(contest.userCount, locale.locale) }}
            <span v-if="contest.virtualCount" class="block text-[12.5px] text-muted">{{
              $t('contests.virtualExtra', {
                count: formatNumber(contest.virtualCount, locale.locale),
              })
            }}</span>
          </td>
          <td class="px-5 py-3 text-right">
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
  </div>
</template>
