<script setup lang="ts">
import Card from './ui/Card.vue';

/** The page card under its old name; new code uses `ui/Card.vue`. */
withDefaults(defineProps<{ as?: string }>(), { as: 'section' });
</script>

<template>
  <Card :as="as">
    <slot />
  </Card>
</template>
