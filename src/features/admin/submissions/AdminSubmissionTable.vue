<script setup lang="ts">
import { computed } from 'vue';
import type { SubmissionListItem } from '@/api/types/submissions';
import ScrollRegion from '@/components/ScrollRegion.vue';
import UserName from '@/components/UserName.vue';
import VerdictBadge from '@/components/VerdictBadge.vue';
import { formatCaseMemory, formatCaseTime, formatNumericDateTime } from '@/lib/format';
import { verdictOf } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import { shortId } from '../ui/short-id';

/** Staff columns of the old changelist (time, memory, points, language). With `selectable`, a checkbox column drives `selected`. */
const props = defineProps<{ items: SubmissionListItem[]; label: string; selectable?: boolean }>();
const selected = defineModel<string[]>('selected', { default: () => [] });
const locale = useLocaleStore();
const pageIds = computed(() => props.items.map((item) => item.id));
const isPageSelected = computed(
  () => pageIds.value.length > 0 && pageIds.value.every((id) => selected.value.includes(id)),
);
function togglePage() {
  selected.value = isPageSelected.value
    ? selected.value.filter((id) => !pageIds.value.includes(id))
    : [...new Set([...selected.value, ...pageIds.value])];
}
const pointsText = (item: SubmissionListItem) =>
  item.points === null || !item.problem ? '—' : `${item.points} / ${item.problem.points}`;
const CELL = 'px-3 py-2 whitespace-nowrap';
</script>

<template>
  <ScrollRegion :label="label">
    <table class="w-full text-left text-sm">
      <thead class="text-xs text-muted">
        <tr class="border-b border-line">
          <th v-if="selectable" :class="CELL" scope="col">
            <input
              type="checkbox"
              class="size-5"
              :checked="isPageSelected"
              :aria-label="$t('admin.submissions.table.selectPage')"
              @change="togglePage"
            />
          </th>
          <th :class="CELL" scope="col">{{ $t('admin.submissions.table.id') }}</th>
          <th :class="CELL" scope="col">{{ $t('admin.submissions.table.user') }}</th>
          <th :class="CELL" scope="col">{{ $t('admin.submissions.table.problem') }}</th>
          <th :class="CELL" scope="col">{{ $t('admin.submissions.table.verdict') }}</th>
          <th :class="CELL" scope="col">{{ $t('admin.submissions.table.points') }}</th>
          <th :class="CELL" scope="col">{{ $t('admin.submissions.table.time') }}</th>
          <th :class="CELL" scope="col">{{ $t('admin.submissions.table.memory') }}</th>
          <th :class="CELL" scope="col">{{ $t('admin.submissions.table.language') }}</th>
          <th :class="CELL" scope="col">{{ $t('admin.submissions.table.date') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in items"
          :key="item.id"
          class="border-b border-line last:border-0"
          :class="selected.includes(item.id) ? 'bg-accent-soft' : 'hover:bg-surface-hover'"
        >
          <td v-if="selectable" :class="CELL">
            <input
              v-model="selected"
              type="checkbox"
              class="size-5"
              :value="item.id"
              :aria-label="$t('admin.submissions.table.select', { id: shortId(item.id) })"
            />
          </td>
          <td :class="CELL">
            <RouterLink
              :to="{ name: 'submission', params: { id: item.id } }"
              class="font-mono text-accent-text hover:underline"
              >{{ shortId(item.id) }}</RouterLink
            >
          </td>
          <td :class="CELL">
            <UserName v-if="item.user" :username="item.user.username" />
            <span v-else class="text-muted">—</span>
          </td>
          <td :class="CELL" class="font-mono">{{ item.problem?.code ?? '—' }}</td>
          <td :class="CELL"><VerdictBadge :verdict="verdictOf(item)" size="sm" /></td>
          <td :class="CELL" class="font-mono">{{ pointsText(item) }}</td>
          <td :class="CELL" class="font-mono">
            {{ item.time === null ? '—' : formatCaseTime(item.time) }}
          </td>
          <td :class="CELL" class="font-mono">
            {{ item.memory === null ? '—' : formatCaseMemory(item.memory) }}
          </td>
          <td :class="CELL">{{ item.language?.name ?? '—' }}</td>
          <td :class="CELL" class="text-muted">
            {{ formatNumericDateTime(item.date, locale.locale) }}
          </td>
        </tr>
      </tbody>
    </table>
  </ScrollRegion>
</template>
