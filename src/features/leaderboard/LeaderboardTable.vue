<script setup lang="ts">
import { computed, nextTick, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ArrowDown } from 'lucide-vue-next';
import { useRoute, useRouter } from 'vue-router';
import type { LeaderboardEntry, LeaderboardSort, RankField } from '@/api/types/users';
import ToolbarSelect from '@/components/ToolbarSelect.vue';
import ScrollRegion from '@/components/ScrollRegion.vue';
import StateBit from '@/components/StateBit.vue';
import UserName from '@/components/UserName.vue';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import {
  AVATAR_PX,
  BOARD_HEAD_CLASS,
  BOARD_TABLE_CLASS,
  BOARD_ROW_CLASS,
  ORGANIZATION_CELL_CLASS,
  ORGANIZATION_HEAD_CLASS,
  RANK_CELL_CLASS,
  RANK_HEAD_CLASS,
  USER_CELL_CLASS,
  USER_HEAD_CLASS,
  valueCellClass,
  valueHeadClass,
  VALUE_HEAD_INNER_CLASS,
} from './leaderboard-cells';
import { boardColumns, rowAnchor, sortLocation } from './leaderboard-columns';
import { medalClass } from '@/lib/medal';
import { revealRow } from './reveal-row';

const props = defineProps<{
  entries: LeaderboardEntry[];
  sort: LeaderboardSort;
  viewerName: string | null;
}>();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const locale = useLocaleStore();
const valueOf = (entry: LeaderboardEntry, key: RankField) =>
  entry[key] === null ? '—' : formatNumber(entry[key], locale.locale);
const sortOptions = computed(() =>
  boardColumns(props.sort).map((column) => ({ value: column.key, label: t(column.labelKey) })),
);
const changeSort = (key: string) => router.push(sortLocation(key as LeaderboardSort));
const scrollToTarget = async () => {
  await nextTick();
  if (route.hash) revealRow(route.hash.slice(1));
};
watch(() => [props.entries, route.hash], scrollToTarget, { immediate: true });
</script>

<template>
  <ToolbarSelect
    class="lg:hidden"
    :label="$t('leaderboard.sortBy')"
    :model-value="sort"
    :options="sortOptions"
    :active="false"
    @update:model-value="changeSort"
  />
  <ScrollRegion :label="$t('leaderboard.scrollRegion')">
    <table :class="BOARD_TABLE_CLASS">
      <thead :class="BOARD_HEAD_CLASS">
        <tr>
          <th scope="col" :class="RANK_HEAD_CLASS">
            <span
              ><span aria-hidden="true">#</span
              ><span class="sr-only">{{ $t('leaderboard.columns.rank') }}</span></span
            >
          </th>
          <th scope="col" :class="USER_HEAD_CLASS">{{ $t('leaderboard.columns.user') }}</th>
          <th scope="col" :class="ORGANIZATION_HEAD_CLASS">
            {{ $t('leaderboard.columns.organization') }}
          </th>
          <th
            v-for="column in boardColumns(sort)"
            :key="column.key"
            scope="col"
            :class="valueHeadClass(column.isActive)"
            :aria-sort="column.isActive ? 'descending' : 'none'"
          >
            <button
              type="button"
              :class="[
                VALUE_HEAD_INNER_CLASS,
                'cursor-pointer rounded-skeleton uppercase hover:text-content',
              ]"
              @click="router.push(sortLocation(column.key))"
            >
              {{ $t(column.labelKey) }}
              <ArrowDown
                :size="14"
                aria-hidden="true"
                class="shrink-0"
                :class="{ invisible: !column.isActive }"
              />
            </button>
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
            <span class="flex min-h-10 items-center gap-2.5">
              <UserAvatar :username="entry.username" :size="AVATAR_PX" class="shrink-0" />
              <span class="flex min-w-0 flex-col justify-center">
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
                <span
                  v-if="entry.displayName !== entry.username"
                  class="truncate text-xs text-muted"
                >
                  {{ entry.displayName }}
                </span>
              </span>
            </span>
          </td>
          <td :class="ORGANIZATION_CELL_CLASS">
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
  </ScrollRegion>
</template>
