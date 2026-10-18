<script setup lang="ts">
import RankColumnHeader from '@/components/RankColumnHeader.vue';
import { computed } from 'vue';
import type { RatingHistoryEntry } from '@/api/types/users';
import Card from '@/components/ui/Card.vue';
import { signedScore } from '@/lib/format';
import { recentContests } from './recent-contests';
import type { RecentContestRow } from './recent-contests';

/** The last contests a viewer may see, newest first; a table from `md`, a list below it. Renders nothing without history. */
const props = defineProps<{ history: RatingHistoryEntry[] }>();
const RECENT_COUNT = 5;
const rows = computed(() => recentContests(props.history, RECENT_COUNT));

const DASH = '—';
const orDash = (value: number | null) => (value === null ? DASH : String(Math.round(value)));
const deltaText = (delta: number | null) => (delta === null ? DASH : signedScore(delta));
const deltaClass = (delta: number | null) =>
  delta === null || delta === 0 ? 'text-muted' : delta > 0 ? 'text-positive' : 'text-negative';
const rowKey = (row: RecentContestRow, index: number) => row.key ?? `hidden-${index}`;
</script>

<template>
  <Card v-if="rows.length" data-testid="recent-contests" class="p-5">
    <h2 class="font-display text-base font-bold">{{ $t('profile.recent') }}</h2>
    <table class="mt-3 hidden w-full text-left text-sm md:table">
      <thead class="text-muted">
        <tr>
          <th scope="col" class="py-2 font-semibold">{{ $t('profile.columns.contest') }}</th>
          <th scope="col" class="py-2 pl-4 text-right font-semibold">
            <RankColumnHeader :label="$t('profile.columns.rank')" />
          </th>
          <th scope="col" class="py-2 pl-4 text-right font-semibold">
            {{ $t('profile.columns.performance') }}
          </th>
          <th scope="col" class="py-2 pl-4 text-right font-semibold">
            {{ $t('profile.columns.rating') }}
          </th>
          <th scope="col" class="py-2 pl-4 text-right font-semibold">
            {{ $t('profile.columns.delta') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in rows" :key="rowKey(row, index)" class="border-t border-line">
          <td class="py-2">
            <RouterLink
              v-if="row.key"
              :to="{ name: 'contest', params: { key: row.key } }"
              class="font-semibold hover:underline"
            >
              {{ row.name }}
            </RouterLink>
            <span v-else class="text-muted">{{ $t('ratingChart.hiddenContest') }}</span>
          </td>
          <td class="py-2 pl-4 text-right tabular-nums">{{ orDash(row.rank) }}</td>
          <td class="py-2 pl-4 text-right tabular-nums">{{ orDash(row.performance) }}</td>
          <td class="py-2 pl-4 text-right tabular-nums">{{ orDash(row.rating) }}</td>
          <td
            class="py-2 pl-4 text-right font-semibold tabular-nums"
            :class="deltaClass(row.delta)"
          >
            {{ deltaText(row.delta) }}
          </td>
        </tr>
      </tbody>
    </table>
    <ul class="mt-3 flex flex-col gap-3 md:hidden">
      <li
        v-for="(row, index) in rows"
        :key="rowKey(row, index)"
        class="flex flex-col gap-1 border-t border-line pt-3"
      >
        <RouterLink
          v-if="row.key"
          :to="{ name: 'contest', params: { key: row.key } }"
          class="font-semibold hover:underline"
        >
          {{ row.name }}
        </RouterLink>
        <span v-else class="text-muted">{{ $t('ratingChart.hiddenContest') }}</span>
        <span class="text-sm text-muted">
          {{ $t('profile.rankLine', { rank: orDash(row.rank) }) }} · {{ orDash(row.rating) }}
          <span class="font-semibold" :class="deltaClass(row.delta)">{{
            deltaText(row.delta)
          }}</span>
        </span>
      </li>
    </ul>
  </Card>
</template>
