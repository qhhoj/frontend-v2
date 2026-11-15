<script setup lang="ts">
import { computed } from 'vue';
import Chip from '@/components/ui/Chip.vue';
import { joinModeKey } from './organization-facts';

/** How one joins: freely when open, else by approval. */
const props = withDefaults(defineProps<{ isOpen: boolean; size?: 'sm' | 'md' }>(), { size: 'md' });
const labelKey = computed(() => joinModeKey(props.isOpen));
</script>

<template>
  <Chip :tone="isOpen ? 'success' : 'neutral'" :size="size">{{ $t(labelKey) }}</Chip>
</template>
