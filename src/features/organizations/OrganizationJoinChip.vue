<script setup lang="ts">
import { computed } from 'vue';
import Chip from '@/components/ui/Chip.vue';
import { joinModeKey } from './organization-facts';

/** How one joins: freely when open, else by approval. */
const props = defineProps<{ isOpen: boolean }>();
const labelKey = computed(() => joinModeKey(props.isOpen));
</script>

<template>
  <Chip :tone="isOpen ? 'success' : 'neutral'" size="md">{{ $t(labelKey) }}</Chip>
</template>
