<script setup lang="ts">
import { computed } from 'vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdminBit from '../shell/AdminBit.vue';
import type { JudgeStats, JudgeStatus } from './judge-stats';

/** The online, blocked and disabled tiles also filter the list (`status`); pressing the active one clears it. */
const props = defineProps<{ stats: JudgeStats }>();
const status = defineModel<JudgeStatus | null>('status', { default: null });
const locale = useLocaleStore();
const meanLoadText = computed(() =>
  props.stats.meanLoad === null ? null : formatNumber(props.stats.meanLoad, locale.locale, 2),
);
const toggle = (next: JudgeStatus) => (status.value = status.value === next ? null : next);
const TILE =
  'flex flex-col items-start rounded-row p-2 text-left hover:bg-surface-hover aria-pressed:bg-accent-soft';
</script>

<template>
  <section
    data-testid="judge-stats"
    class="glass grid grid-cols-2 gap-2 rounded-panel p-3 sm:grid-cols-4"
  >
    <button
      type="button"
      :class="TILE"
      :aria-pressed="status === 'online'"
      @click="toggle('online')"
    >
      <span class="font-display text-2xl font-semibold"
        >{{ stats.online }} / {{ stats.total }}</span
      >
      <span class="flex items-center gap-1.5 text-sm text-muted">
        <AdminBit v-if="stats.online > 0" placement="queued" />
        {{ $t('admin.judges.stats.online') }}
      </span>
    </button>
    <div class="p-2">
      <p class="font-display text-2xl font-semibold">
        {{ meanLoadText ?? $t('admin.judges.stats.noLoad') }}
      </p>
      <p class="text-sm text-muted">{{ $t('admin.judges.stats.load') }}</p>
    </div>
    <button
      v-for="key in ['blocked', 'disabled'] as const"
      :key="key"
      type="button"
      :class="TILE"
      :aria-pressed="status === key"
      @click="toggle(key)"
    >
      <span class="font-display text-2xl font-semibold">{{ stats[key] }}</span>
      <span class="text-sm text-muted">{{ $t(`admin.judges.stats.${key}`) }}</span>
    </button>
  </section>
</template>
