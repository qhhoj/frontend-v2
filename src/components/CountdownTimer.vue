<script setup lang="ts">
import { computed, watch } from 'vue';
import { formatDuration } from '@/lib/format';
import { useNow } from '@/lib/use-now';

const props = defineProps<{ until: string }>();
const emit = defineEmits<{ elapsed: [] }>();
const now = useNow();
const remaining = computed(() =>
  Math.max(0, Math.floor((Date.parse(props.until) - now.value) / 1000)),
);
watch(remaining, (seconds, previous) => {
  if (seconds === 0 && previous > 0) emit('elapsed');
});
</script>

<template>
  <time role="timer" :datetime="until" class="font-mono tabular-nums">{{
    formatDuration(remaining)
  }}</time>
</template>
