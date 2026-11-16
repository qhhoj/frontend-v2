<script setup lang="ts">
import { computed } from 'vue';
import type { RatingHistoryEntry } from '@/api/types/users';
import Chip from '@/components/ui/Chip.vue';
import PageSection from '@/components/ui/PageSection.vue';
import DataTable from '@/components/ui/DataTable.vue';
import { NO_VALUE, signedScore } from '@/lib/format';
import { deltaTone } from '@/lib/rating-delta';
import { recentContestColumns, recentContests } from './recent-contests';
import type { RecentContestRow } from './recent-contests';

/** The last contests a viewer may see, newest first; a table from `sm`, cards below it. Renders nothing without history. */
const props = defineProps<{ history: RatingHistoryEntry[] }>();
const RECENT_COUNT = 5;
const rows = computed(() => recentContests(props.history, RECENT_COUNT));

const COLUMNS = computed(recentContestColumns);

const orDash = (value: number | null) => (value === null ? NO_VALUE : String(Math.round(value)));
const deltaText = (delta: number | null) => (delta === null ? NO_VALUE : signedScore(delta));
/** A hidden contest has no key and no page: its row is a plain label (so no `rowTo`, which every row would need). */
const rowKey = (row: RecentContestRow) => row.key ?? `hidden-${rows.value.indexOf(row)}`;
</script>

<template>
  <PageSection v-if="rows.length" :title="$t('profile.recent')">
    <DataTable
      data-testid="recent-contests"
      :columns="COLUMNS"
      :rows="rows"
      :row-key="rowKey"
      :label="$t('profile.recent')"
    >
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
        <Chip
          v-if="deltaTone(row.delta) !== 'neutral'"
          :tone="deltaTone(row.delta)"
          class="font-mono tabular-nums"
          >{{ deltaText(row.delta) }}</Chip
        >
        <span v-else class="font-semibold text-muted">{{ deltaText(row.delta) }}</span>
      </template>
    </DataTable>
  </PageSection>
</template>
