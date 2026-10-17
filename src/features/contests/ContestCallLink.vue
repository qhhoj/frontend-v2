<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';

/** `compact`: the small button at the end of a phone row (P-04 B), 44 px on touch. */
defineProps<{
  contestKey: string;
  contestName: string;
  labelKey: string;
  isPrimary: boolean;
  compact?: boolean;
}>();
</script>

<template>
  <AppButton
    :to="{ name: 'contest', params: { key: contestKey } }"
    :tone="isPrimary ? 'primary' : 'secondary'"
    :size="compact ? 'sm' : 'md'"
    :class="['justify-center whitespace-nowrap', compact ? 'relative' : 'min-w-52']"
    >{{ $t(labelKey) }}<span class="sr-only">: {{ contestName }}</span></AppButton
  >
</template>
