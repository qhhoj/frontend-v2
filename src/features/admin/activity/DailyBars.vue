<script setup lang="ts">
import { computed } from 'vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { dailyBars } from './activity';

const WIDTH = 300;
const HEIGHT = 60;

const props = defineProps<{ daily: { day: string; count: number }[] }>();
const locale = useLocaleStore();
const bars = computed(() => dailyBars(props.daily, WIDTH, HEIGHT));
const step = computed(() => WIDTH / Math.max(1, props.daily.length));
const busiest = computed(() => Math.max(0, ...props.daily.map((entry) => entry.count)));
const firstDay = computed(() => props.daily[0]?.day ?? '');
const lastDay = computed(() => props.daily.at(-1)?.day ?? '');
</script>

<template>
  <figure class="flex flex-col gap-1">
    <svg
      :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
      preserveAspectRatio="none"
      role="img"
      :aria-label="
        $t('admin.activity.summary.chart', { max: formatNumber(busiest, locale.locale) })
      "
      class="h-16 w-full"
    >
      <rect
        v-for="bar in bars"
        :key="bar.label"
        :x="bar.x + 1"
        :y="HEIGHT - bar.height"
        :width="step - 2"
        :height="bar.height"
        class="fill-accent"
      >
        <title>{{ bar.label }}</title>
      </rect>
    </svg>
    <figcaption class="flex justify-between font-mono text-xs text-muted">
      <span>{{ firstDay }}</span>
      <span>{{ lastDay }}</span>
    </figcaption>
    <table class="sr-only">
      <thead>
        <tr>
          <th scope="col">{{ $t('admin.activity.summary.chartDay') }}</th>
          <th scope="col">{{ $t('admin.activity.summary.chartCount') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in daily" :key="entry.day">
          <td>{{ entry.day }}</td>
          <td>{{ formatNumber(entry.count, locale.locale) }}</td>
        </tr>
      </tbody>
    </table>
  </figure>
</template>
