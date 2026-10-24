<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';

/**
 * `compact`: the button inside a row (the ended-contest table's "Xem", the end of a phone row on a phone): small, 44 px on
 * touch, and above the row's whole-row link (`relative`). The cards keep the wide button.
 */
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
