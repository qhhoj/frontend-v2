<script setup lang="ts">
import { computed } from 'vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdminBit from '../shell/AdminBit.vue';
import type { JudgeStats } from './judge-stats';

const props = defineProps<{ stats: JudgeStats }>();
const locale = useLocaleStore();
const meanLoadText = computed(() =>
  props.stats.meanLoad === null ? null : formatNumber(props.stats.meanLoad, locale.locale, 2),
);
</script>

<template>
  <section
    data-testid="judge-stats"
    class="glass grid grid-cols-2 gap-4 rounded-panel p-5 sm:grid-cols-4"
  >
    <div>
      <p class="font-display text-2xl font-semibold">{{ stats.online }} / {{ stats.total }}</p>
      <p class="flex items-center gap-1.5 text-sm text-muted">
        <AdminBit v-if="stats.online > 0" placement="queued" />
        {{ $t('admin.judges.stats.online') }}
      </p>
    </div>
    <div>
      <p class="font-display text-2xl font-semibold">
        {{ meanLoadText ?? $t('admin.judges.stats.noLoad') }}
      </p>
      <p class="text-sm text-muted">{{ $t('admin.judges.stats.load') }}</p>
    </div>
    <div>
      <p class="font-display text-2xl font-semibold">{{ stats.blocked }}</p>
      <p class="text-sm text-muted">{{ $t('admin.judges.stats.blocked') }}</p>
    </div>
    <div>
      <p class="font-display text-2xl font-semibold">{{ stats.disabled }}</p>
      <p class="text-sm text-muted">{{ $t('admin.judges.stats.disabled') }}</p>
    </div>
  </section>
</template>
