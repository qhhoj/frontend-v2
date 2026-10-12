<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { spanMessage } from '@/lib/contest-time';
import { contestWindowOf } from './contest-window';

/** "08/10 15:00 → 18:24 · 3 giờ 24 phút", in the site's time zone; a narrow cell wraps only before the length. */
const props = defineProps<{ startTime: string; endTime: string }>();
const { t } = useI18n();
const window = computed(() => contestWindowOf(props.startTime, props.endTime));
const spanText = computed(() => {
  const span = spanMessage(window.value.seconds);
  return span.count === undefined ? t(span.key, span.params) : t(span.key, span.params, span.count);
});
</script>

<template>
  <span class="font-mono text-meta tabular-nums">
    <span class="whitespace-nowrap">{{
      $t('admin.contests.list.window', { start: window.start, end: window.end })
    }}</span>
    {{ ' ' }}<span class="whitespace-nowrap text-muted">· {{ spanText }}</span>
  </span>
</template>
