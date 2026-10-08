<script setup lang="ts">
import { computed } from 'vue';
import { joinModeKey } from './organization-facts';

/** How one joins: freely when open, else by approval. */
const props = defineProps<{ isOpen: boolean }>();
const labelKey = computed(() => joinModeKey(props.isOpen));
</script>

<template>
  <span class="rounded-pill border border-line px-3 py-1 text-sm text-muted">
    {{ $t(labelKey) }}
  </span>
</template>
