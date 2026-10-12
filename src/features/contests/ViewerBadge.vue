<script setup lang="ts">
import Chip from '@/components/ui/Chip.vue';

defineProps<{ badgeKey: string | null }>();
</script>

<template>
  <Chip v-if="badgeKey" data-testid="viewer-badge" tone="accent">{{ $t(badgeKey) }}</Chip>
</template>
