<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Card from '@/components/ui/Card.vue';
import StatGrid from '@/components/ui/StatGrid.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import type { RuntimeTotals } from './runtimes-model';

const props = defineProps<{ totals: RuntimeTotals; queueLength: number | null }>();
const locale = useLocaleStore();
const { t } = useI18n();
const NO_VALUE = '—';
const tiles = computed(() => [
  { label: t('runtimes.tiles.online'), value: `${props.totals.online}/${props.totals.total}` },
  { label: t('runtimes.tiles.busy'), value: `${props.totals.busy}/${props.totals.slots}` },
  {
    label: t('runtimes.tiles.queue'),
    value: props.queueLength === null ? NO_VALUE : formatNumber(props.queueLength, locale.locale),
  },
  {
    label: t('runtimes.tiles.ping'),
    value: props.totals.pingMs === null ? NO_VALUE : `${props.totals.pingMs} ms`,
  },
]);
</script>

<template>
  <Card padding="sm">
    <StatGrid :items="tiles" :cols="4" mode="stat" />
  </Card>
</template>
