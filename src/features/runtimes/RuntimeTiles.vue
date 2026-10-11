<script setup lang="ts">
import { computed } from 'vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import type { RuntimeTotals } from './runtimes-model';

const props = defineProps<{ totals: RuntimeTotals; queueLength: number | null }>();
const locale = useLocaleStore();
const NO_VALUE = '—';
const tiles = computed(() => [
  { id: 'online', value: `${props.totals.online}/${props.totals.total}` },
  { id: 'busy', value: `${props.totals.busy}/${props.totals.slots}` },
  {
    id: 'queue',
    value: props.queueLength === null ? NO_VALUE : formatNumber(props.queueLength, locale.locale),
  },
  { id: 'ping', value: props.totals.pingMs === null ? NO_VALUE : `${props.totals.pingMs} ms` },
]);
</script>

<template>
  <section class="glass grid grid-cols-2 gap-2 rounded-panel p-3 sm:grid-cols-4">
    <div v-for="tile in tiles" :key="tile.id" :data-testid="`runtime-tile-${tile.id}`" class="p-2">
      <p class="font-display text-2xl font-semibold">{{ tile.value }}</p>
      <p class="text-sm text-muted">{{ $t(`runtimes.tiles.${tile.id}`) }}</p>
    </div>
  </section>
</template>
