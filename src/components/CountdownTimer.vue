<script setup lang="ts">
import { computed, watch } from 'vue';
import { useCountdownText } from '@/lib/use-countdown-text';
import { useNow } from '@/lib/use-now';

const props = defineProps<{ until: string }>();
const emit = defineEmits<{ elapsed: [] }>();
const countdownText = useCountdownText();
const now = useNow();
const remaining = computed(() =>
  Math.max(0, Math.floor((Date.parse(props.until) - now.value) / 1000)),
);
const text = computed(() => countdownText(remaining.value));
watch(remaining, (seconds) => seconds === 0 && emit('elapsed'));
</script>

<template>
  <time role="timer" :datetime="until" class="font-mono tabular-nums">{{ text }}</time>
</template>
