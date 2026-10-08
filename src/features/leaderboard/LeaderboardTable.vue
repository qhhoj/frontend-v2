<script setup lang="ts">
import { nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { BoardSort, LeaderboardEntry, RankField } from '@/api/types/users';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import StateBit from '@/components/StateBit.vue';
import UserName from '@/components/UserName.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { boardColumns, rowAnchor } from './leaderboard-columns';

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
  if (route.hash) document.getElementById(route.hash.slice(1))?.scrollIntoView({ block: 'center' });
};
watch(() => [props.entries, route.hash], scrollToTarget, { immediate: true });
</script>

<template>
  <table class="w-full text-sm">
    <thead class="text-left text-[12px] font-semibold tracking-wide text-muted uppercase">
      <tr>
        <th scope="col" class="px-3 py-2 text-right">{{ $t('leaderboard.columns.rank') }}</th>
        <th scope="col" class="px-3 py-2">{{ $t('leaderboard.columns.user') }}</th>
        <th v-if="sort !== 'contributors'" scope="col" class="hidden px-3 py-2 md:table-cell">
          {{ $t('leaderboard.columns.organization') }}
        </th>
        <th
          v-for="column in boardColumns(sort)"
          :key="column.key"
          scope="col"
          class="px-3 py-2 text-right"
          :class="column.isActive ? 'text-content' : 'hidden md:table-cell'"
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
        class="border-t border-line target:bg-accent-soft"
        :class="{ 'bg-accent-soft': entry.username === viewerName }"
      >
        <td class="px-3 py-2.5 text-right font-mono tabular-nums">
          <span class="inline-flex items-center justify-end gap-1.5">
            <StateBit v-if="entry.rank <= 3" variant="rankUp" size="tiny" />
            {{ formatNumber(entry.rank, locale.locale) }}
          </span>
        </td>
        <td class="px-3 py-2.5">
          <span class="flex items-center gap-2.5">
            <UserAvatar :username="entry.username" :size="28" />
            <span class="flex min-w-0 flex-col">
              <span class="flex items-center gap-2">
                <UserName :username="entry.username" :rating="entry.rating" />
                <span
                  v-if="entry.username === viewerName"
                  class="rounded-pill bg-accent-soft px-2 text-xs font-semibold text-accent-soft-text"
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
        <td v-if="sort !== 'contributors'" class="hidden px-3 py-2.5 text-muted md:table-cell">
          {{ entry.organization?.shortName ?? '—' }}
        </td>
        <td
          v-for="column in boardColumns(sort)"
          :key="column.key"
          class="px-3 py-2.5 text-right font-mono tabular-nums"
          :class="column.isActive ? 'font-semibold' : 'hidden md:table-cell'"
        >
          {{ valueOf(entry, column.key) }}
        </td>
      </tr>
    </tbody>
  </table>
</template>
