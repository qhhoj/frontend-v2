<script setup lang="ts">
import { computed } from 'vue';
import type { RatingHistoryEntry } from '@/api/types/users';
import DataTable from '@/components/ui/DataTable.vue';
import { NO_VALUE, signedScore } from '@/lib/format';
import { recentContestColumns, recentContests } from './recent-contests';
import type { RecentContestRow } from './recent-contests';

/** The last contests a viewer may see, newest first; a table from `sm`, cards below it. Renders nothing without history. */
const props = defineProps<{ history: RatingHistoryEntry[] }>();
const RECENT_COUNT = 5;
const rows = computed(() => recentContests(props.history, RECENT_COUNT));

const COLUMNS = computed(recentContestColumns);

const orDash = (value: number | null) => (value === null ? NO_VALUE : String(Math.round(value)));
const deltaText = (delta: number | null) => (delta === null ? NO_VALUE : signedScore(delta));
const deltaClass = (delta: number | null) =>
  delta === null || delta === 0 ? 'text-muted' : delta > 0 ? 'text-positive' : 'text-negative';
/** A hidden contest has no key and no page: its row is a plain label (so no `rowTo`, which every row would need). */
const rowKey = (row: RecentContestRow) => row.key ?? `hidden-${rows.value.indexOf(row)}`;
</script>

<template>
  <DataTable
    v-if="rows.length"
    data-testid="recent-contests"
    :columns="COLUMNS"
    :rows="rows"
    :row-key="rowKey"
    :label="$t('profile.recent')"
  >
    <template #toolbar>
      <h2 class="text-title leading-5.5 font-semibold">{{ $t('profile.recent') }}</h2>
    </template>
    <template #cell-name="{ row }">
      <RouterLink
        v-if="row.key"
        :to="{ name: 'contest', params: { key: row.key } }"
        class="font-semibold hover:underline"
      >
        {{ row.name }}
      </RouterLink>
      <span v-else class="text-muted">{{ $t('ratingChart.hiddenContest') }}</span>
    </template>
    <template #cell-rank="{ row }">{{ orDash(row.rank) }}</template>
    <template #cell-performance="{ row }">{{ orDash(row.performance) }}</template>
    <template #cell-rating="{ row }">{{ orDash(row.rating) }}</template>
    <template #cell-delta="{ row }">
      <span class="font-semibold" :class="deltaClass(row.delta)">{{ deltaText(row.delta) }}</span>
    </template>
  </DataTable>
</template>
