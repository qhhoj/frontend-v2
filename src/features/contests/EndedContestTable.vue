<script setup lang="ts">
import { computed } from 'vue';
import { serverNow } from '@/lib/server-clock';
import { CARD_VARIANTS } from '@/components/ui/Card.variants';
import type { ContestListItem } from '@/api/types/contests';
import CompactListRow from '@/components/CompactListRow.vue';
import { formatLabel } from '@/lib/contest-format';
import { COMPACT_LIST_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { formatNumber } from '@/lib/format';
import { formatDate } from '@/lib/format-date';
import { translate } from '@/i18n';
import { useLocaleStore } from '@/stores/locale.store';
import { useRowOpen } from '@/components/ui/use-row-open';
import FactLine from '@/components/FactLine.vue';
import ContestCallLink from './ContestCallLink.vue';
import ContestChips from './ContestChips.vue';
import ContestEditLink from './ContestEditLink.vue';
import { listCallToAction } from './contest-action';
import {
  ENDED_CELL,
  ENDED_HEAD_ROW_CLASS,
  ENDED_ROW_CLASS,
  ENDED_TABLE_CLASS,
} from './ended-columns';
import { useLengthText } from './use-span-text';
import ViewerBadge from './ViewerBadge.vue';

const props = defineProps<{
  contests: ContestListItem[];
  /** The list is one organization's: its name is not repeated on every row, and editors get a pencil. */
  isOrganizationScoped?: boolean;
}>();
const locale = useLocaleStore();
const { open: openRow, openInTab } = useRowOpen();
const contestTarget = (contest: ContestListItem) => ({
  name: 'contest',
  params: { key: contest.key },
});
/** "Xem" only repeats the row's own link (on a phone too): the button stays for a call that says something else ("Quay lại kỳ thi"). */
const hasOwnCall = (contest: ContestListItem) => callOf(contest).labelKey !== 'contests.list.view';
/** The actions column is there only when a row has a button: otherwise it is an empty strip. */
const hasActions = computed(() => props.contests.some((contest) => hasOwnCall(contest)));
const lengthOf = useLengthText();
/** Ended rows do not change with the clock, so each render reads it once. */
const callOf = (contest: ContestListItem) => listCallToAction(contest, serverNow());
/** One date format (dd/MM/yyyy) and one length format (`useLengthText`) on every row. */
const lengthSeconds = (contest: ContestListItem) =>
  (Date.parse(contest.endTime) - Date.parse(contest.startTime)) / 1000;
const dateText = (contest: ContestListItem) => formatDate(contest.startTime, 'date', locale.locale);
const lengthText = (contest: ContestListItem) => lengthOf(lengthSeconds(contest));
/** A phone gets stacked rows: the name, then date · length · format, the contestants and the action at the end. */
const isCompact = useMediaQuery(COMPACT_LIST_QUERY);
const compactFacts = (contest: ContestListItem) => [
  dateText(contest),
  lengthText(contest),
  formatLabel(contest.formatName),
];
</script>

<template>
  <div
    v-if="isCompact"
    data-testid="ended-contests"
    :class="[CARD_VARIANTS.glass, 'overflow-hidden']"
  >
    <ul :aria-label="$t('contests.phase.ended')" class="m-0 list-none p-0">
      <CompactListRow
        v-for="contest in contests"
        :key="contest.key"
        :to="{ name: 'contest', params: { key: contest.key } }"
        :title="contest.name"
      >
        <template #meta>
          <FactLine :facts="compactFacts(contest)" />
          <span class="mt-1 flex flex-wrap items-center gap-1.5 empty:hidden"
            ><ContestChips :contest="contest" with-tags with-code-needed hide-format
          /></span>
        </template>
        <template #trail>
          <span class="font-mono text-caption text-muted tabular-nums">{{
            translate('contests.list.contestantCount', {
              count: formatNumber(contest.userCount, locale.locale),
            })
          }}</span>
          <ContestCallLink
            v-if="hasOwnCall(contest)"
            compact
            :contest-key="contest.key"
            :contest-name="contest.name"
            :label-key="callOf(contest).labelKey"
            :is-primary="callOf(contest).isPrimary"
          />
        </template>
      </CompactListRow>
    </ul>
  </div>
  <div v-else data-testid="ended-contests" :class="[CARD_VARIANTS.glass, 'overflow-hidden']">
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
          <th scope="col" class="font-semibold" :class="ENDED_CELL.length">
            {{ $t('contests.list.columns.length') }}
          </th>
          <th scope="col" class="font-semibold" :class="ENDED_CELL.format">
            {{ $t('contests.list.columns.format') }}
          </th>
          <th scope="col" class="font-semibold" :class="ENDED_CELL.participants">
            {{ $t('contests.list.columns.participants') }}
          </th>
          <th v-if="hasActions" scope="col" :class="ENDED_CELL.action">
            <span class="sr-only">{{ $t('contests.list.columns.action') }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="contest in contests"
          :key="contest.key"
          :class="[ENDED_ROW_CLASS, 'cursor-pointer hover:bg-surface-hover']"
          @click="openRow($event, contestTarget(contest))"
          @auxclick="openInTab($event, contestTarget(contest))"
        >
          <th scope="row" class="text-left font-normal" :class="ENDED_CELL.name">
            <span class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <RouterLink
                :to="{ name: 'contest', params: { key: contest.key } }"
                class="font-semibold text-cue-ended hover:text-accent-text"
                >{{ contest.name }}</RouterLink
              >
              <ContestChips
                :contest="contest"
                with-tags
                with-code-needed
                :hide-organizations="isOrganizationScoped"
                hide-format
              />
              <ViewerBadge :badge-key="callOf(contest).badgeKey" />
            </span>
            <span
              v-if="isOrganizationScoped"
              class="flex items-center gap-1 font-mono text-caption text-muted"
              >{{ contest.key }}<ContestEditLink :contest="contest"
            /></span>
          </th>
          <td class="tabular-nums" :class="ENDED_CELL.when">{{ dateText(contest) }}</td>
          <td class="font-mono tabular-nums" :class="ENDED_CELL.length">
            {{ lengthText(contest) }}
          </td>
          <td :class="ENDED_CELL.format">{{ formatLabel(contest.formatName) }}</td>
          <td class="font-mono tabular-nums" :class="ENDED_CELL.participants">
            {{ formatNumber(contest.userCount, locale.locale) }}
          </td>
          <td v-if="hasActions" :class="ENDED_CELL.action">
            <ContestCallLink
              v-if="hasOwnCall(contest)"
              :contest-key="contest.key"
              :contest-name="contest.name"
              :label-key="callOf(contest).labelKey"
              :is-primary="callOf(contest).isPrimary"
              compact
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
