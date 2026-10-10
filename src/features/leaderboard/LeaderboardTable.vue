<script setup lang="ts">
import { nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { BoardSort, LeaderboardEntry, RankField } from '@/api/types/users';
import StateBit from '@/components/StateBit.vue';
import UserName from '@/components/UserName.vue';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import {
  AVATAR_PX,
  BOARD_HEAD_CLASS,
  BOARD_ROW_CLASS,
  ORGANIZATION_CELL_CLASS,
  ORGANIZATION_HEAD_CLASS,
  RANK_CELL_CLASS,
  RANK_HEAD_CLASS,
  USER_CELL_CLASS,
  USER_HEAD_CLASS,
  medalClass,
  valueCellClass,
  valueHeadClass,
} from './leaderboard-cells';
import { boardColumns, rowAnchor } from './leaderboard-columns';
import { revealRow } from './reveal-row';

const props = defineProps<{
  entries: LeaderboardEntry[];
  sort: BoardSort;
  viewerName: string | null;
}>();
const route = useRoute();
const locale = useLocaleStore();
const valueOf = (entry: LeaderboardEntry, key: RankField) =>
  entry[key] === null ? '—' : formatNumber(entry[key], locale.locale);
const scrollToTarget = async () => {
  await nextTick();
  if (route.hash) revealRow(route.hash.slice(1));
};
watch(() => [props.entries, route.hash], scrollToTarget, { immediate: true });
</script>

<template>
  <table class="w-full table-fixed text-sm">
    <thead :class="BOARD_HEAD_CLASS">
      <tr>
        <th scope="col" :class="RANK_HEAD_CLASS">{{ $t('leaderboard.columns.rank') }}</th>
        <th scope="col" :class="USER_HEAD_CLASS">{{ $t('leaderboard.columns.user') }}</th>
        <th v-if="sort !== 'contributors'" scope="col" :class="ORGANIZATION_HEAD_CLASS">
          {{ $t('leaderboard.columns.organization') }}
        </th>
        <th
          v-for="column in boardColumns(sort)"
          :key="column.key"
          scope="col"
          :class="valueHeadClass(column.isActive)"
        >
          {{ $t(column.labelKey) }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="entry in entries"
        :id="rowAnchor(entry.username)"
        :key="entry.id"
        tabindex="-1"
        :class="[BOARD_ROW_CLASS, { 'bg-accent-soft': entry.username === viewerName }]"
      >
        <td :class="RANK_CELL_CLASS">
          <span class="flex items-center justify-end gap-1.5" :class="medalClass(entry.rank)">
            <StateBit v-if="entry.rank <= 3" variant="rankUp" size="tiny" />
            {{ formatNumber(entry.rank, locale.locale) }}
          </span>
        </td>
        <td :class="USER_CELL_CLASS">
          <span class="flex items-center gap-2.5">
            <UserAvatar :username="entry.username" :size="AVATAR_PX" class="shrink-0" />
            <span class="flex min-w-0 flex-col">
              <span class="flex items-center gap-2">
                <UserName
                  :username="entry.username"
                  :rating="entry.rating"
                  :title="entry.username"
                  class="min-w-0 truncate"
                />
                <span
                  v-if="entry.username === viewerName"
                  class="shrink-0 rounded-pill bg-accent-soft px-2 text-xs font-semibold text-accent-soft-text"
                >
                  {{ $t('common.you') }}
                </span>
              </span>
              <span v-if="entry.displayName !== entry.username" class="truncate text-xs text-muted">
                {{ entry.displayName }}
              </span>
            </span>
          </span>
        </td>
        <td v-if="sort !== 'contributors'" :class="ORGANIZATION_CELL_CLASS">
          {{ entry.organization?.shortName ?? '—' }}
        </td>
        <td
          v-for="column in boardColumns(sort)"
          :key="column.key"
          :class="valueCellClass(column.isActive)"
        >
          {{ valueOf(entry, column.key) }}
        </td>
      </tr>
    </tbody>
  </table>
</template>
