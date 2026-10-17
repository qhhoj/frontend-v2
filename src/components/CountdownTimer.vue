<script setup lang="ts">
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { countdownView } from '@/lib/contest-time';
import { useNow } from '@/lib/use-now';

/** `short` abbreviates days and hours (`28 ng 14 g`) where a bar has no room for the words. */
const props = defineProps<{ until: string; short?: boolean }>();
const emit = defineEmits<{ elapsed: [] }>();
const { t } = useI18n();
const now = useNow();
const remaining = computed(() =>
  Math.max(0, Math.floor((Date.parse(props.until) - now.value) / 1000)),
);
/** `13 ngày 21 giờ` from 48 hours left, `HH:MM:SS` below (P-18); a whole number of days drops the hours. */
const text = computed(() => {
  const view = countdownView(remaining.value);
  if (view.kind === 'clock') return view.text;
  const { days, hours } = view;
  if (props.short) return t('contests.span.daysHoursShort', { days, hours });
  return hours === 0
    ? t('contests.span.days', { count: days }, days)
    : t('contests.span.daysHours', { days, hours });
});
watch(remaining, (seconds) => seconds === 0 && emit('elapsed'));
</script>

<template>
  <time role="timer" :datetime="until" class="font-mono tabular-nums">{{ text }}</time>
</template>
