<script setup lang="ts">
import { computed } from 'vue';
import { highlightParts } from './index-search';

const props = defineProps<{ text: string; query: string }>();
const parts = computed(() => highlightParts(props.text, props.query));
</script>

<template>
  <span>
    <template v-for="(part, index) in parts" :key="index">
      <mark v-if="part.isHit" class="rounded-sm bg-accent-soft px-0.5 text-accent-soft-text">{{
        part.text
      }}</mark>
      <template v-else>{{ part.text }}</template>
    </template>
  </span>
</template>
