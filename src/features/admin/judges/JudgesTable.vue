<script setup lang="ts">
import { Ban, KeyRound, PanelRight, Trash2, Unplug } from 'lucide-vue-next';
import type { Component } from 'vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Judge } from '@/api/types/judges-admin';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { INPUT, buttonClass } from '../ui/controls';
import AdminDataTable from '../ui/table/AdminDataTable.vue';
import AdminRowMenu from '../ui/table/AdminRowMenu.vue';
import type { RowMenuItem } from '../ui/table/AdminRowMenu.vue';
import type { AdminColumn } from '../ui/table/table-columns';
import type { JudgeAction } from './judge-actions';
import JudgeStatusChip from './JudgeStatusChip.vue';
import { pingMs } from './judge-stats';
import { JUDGE_SEARCH_ID } from './judges.queries';

/**
 * The judges list: one visible row action (Tắt / Bật lại), the rest in ⋯ with Chặn and Xóa last. Each row keeps
 * `data-testid="judge-row"`; below 768 px the rows are cards.
 */
defineProps<{ judges: Judge[]; filtered: boolean; isBusy: boolean }>();
const search = defineModel<string>('search', { required: true });
const emit = defineEmits<{
  toggleDisabled: [judge: Judge];
  act: [action: JudgeAction, judge: Judge];
  clearFilters: [];
}>();
const { t } = useI18n();
const locale = useLocaleStore();

const columns = computed<AdminColumn[]>(() => [
  { key: 'name', label: t('admin.judges.table.name'), priority: 'primary', cellClass: 'py-1.5' },
  { key: 'status', label: t('admin.judges.table.status'), priority: 'badge' },
  { key: 'load', label: t('admin.judges.table.load'), align: 'end' },
  { key: 'ping', label: t('admin.judges.table.ping'), align: 'end' },
  { key: 'busy', label: t('admin.judges.table.busy'), align: 'end' },
  { key: 'build', label: t('admin.judges.table.build'), priority: 'meta', mono: true },
  { key: 'languages', label: t('admin.judges.table.languages'), priority: 'meta', align: 'end' },
  { key: 'ip', label: t('admin.judges.table.ip'), priority: 'meta', mono: true },
]);

const loadText = (judge: Judge) =>
  judge.load === null ? t('admin.judges.stats.noLoad') : formatNumber(judge.load, locale.locale, 2);
const pingText = (judge: Judge) => {
  const ms = pingMs(judge.ping);
  return ms === null ? t('admin.judges.stats.noLoad') : t('admin.judges.row.ping', { ms });
};

/** Chặn and Xóa are the destructive ones (listed last, in red); Xóa exists only for a judge that is not connected. */
function menuOf(judge: Judge): RowMenuItem[] {
  const item = (action: JudgeAction, label: string, icon: Component, danger = false) => ({
    label,
    icon,
    danger,
    run: () => emit('act', action, judge),
  });
  return [
    item('details', t('admin.judges.row.details'), PanelRight),
    item('rotate', t('admin.judges.row.rotate'), KeyRound),
    item('disconnect', t('admin.judges.row.disconnect'), Unplug),
    judge.isBlocked
      ? item('unblock', t('admin.judges.row.unblock'), Ban)
      : item('block', t('admin.judges.row.block'), Ban, true),
    ...(judge.online ? [] : [item('delete', t('common.delete'), Trash2, true)]),
  ];
}
</script>

<template>
  <AdminDataTable
    :columns="columns"
    :rows="judges"
    :row-key="(judge) => judge.name"
    :row-attrs="() => ({ 'data-testid': 'judge-row' })"
    :label="$t('admin.judges.table.caption')"
    :filtered="filtered"
    @clear-filters="emit('clearFilters')"
  >
    <template #toolbar>
      <label class="sr-only" :for="JUDGE_SEARCH_ID">{{ $t('admin.judges.index.search') }}</label>
      <input
        :id="JUDGE_SEARCH_ID"
        v-model="search"
        type="search"
        :class="[INPUT, 'max-w-sm']"
        :placeholder="$t('admin.judges.index.searchPlaceholder')"
      />
    </template>
    <template #cell-name="{ row }">
      <span class="block font-mono font-semibold break-all">{{ row.name }}</span>
      <span v-if="row.description" class="block max-w-80 truncate text-xs text-muted">{{
        row.description
      }}</span>
    </template>
    <template #cell-status="{ row }">
      <JudgeStatusChip :judge="row" />
    </template>
    <template #cell-load="{ row }">{{ loadText(row) }}</template>
    <template #cell-ping="{ row }">{{ pingText(row) }}</template>
    <template #cell-busy="{ row }">{{ row.busy }}/{{ row.slots }}</template>
    <template #cell-build="{ row }">
      <span class="font-mono">{{ row.build || '—' }}</span>
    </template>
    <template #cell-languages="{ row }">{{ row.runtimes.length }}</template>
    <template #cell-ip="{ row }">
      <span class="font-mono">{{ row.lastIp ?? '—' }}</span>
    </template>
    <template #actions="{ row }">
      <button
        type="button"
        :class="buttonClass('secondary', 'sm')"
        :aria-busy="isBusy || undefined"
        @click="emit('toggleDisabled', row)"
      >
        {{ row.isDisabled ? $t('admin.judges.row.enable') : $t('admin.judges.row.disable') }}
      </button>
      <AdminRowMenu :label="$t('common.table.rowMenu', { name: row.name })" :items="menuOf(row)" />
    </template>
    <template v-if="!filtered && judges.length === 0" #empty>
      <slot name="empty" />
    </template>
  </AdminDataTable>
</template>
