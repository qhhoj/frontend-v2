<script setup lang="ts">
import BitLoop from '@/components/BitLoop.vue';

/**
 * Three Bits hopping in turn on a podium (the community look, 52 x 22 pixels). Same box rules as BitLoop: pass `--bit-px` through the
 * class, decorative unless a `label` is given.
 */
defineProps<{ label?: string }>();
</script>

<template>
  <BitLoop kind="community" :label="label" />
</template>
