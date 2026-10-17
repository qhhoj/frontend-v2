<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';

/** `compact` fits a table row ("Xem"); the cards keep the wide button. */
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
    :class="['justify-center whitespace-nowrap', !compact && 'min-w-52']"
    >{{ $t(labelKey) }}<span class="sr-only">: {{ contestName }}</span></AppButton
  >
</template>
