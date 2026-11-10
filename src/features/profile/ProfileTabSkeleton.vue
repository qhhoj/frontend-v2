<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/** Placeholder rows that take the height of a profile tab's loaded rows: `groups` (solved) or `list` (posts, comments). */
defineProps<{ rows: number; kind: 'groups' | 'list' }>();
</script>

<template>
  <ul aria-hidden="true" class="flex flex-col gap-3">
    <li v-for="row in rows" :key="row">
      <Card as="div" class="flex flex-col gap-2 p-4">
        <SkeletonBlock v-if="kind === 'groups'" text class="w-1/3" />
        <SkeletonBlock text class="w-2/3" />
        <SkeletonBlock text class="w-1/2" />
      </Card>
    </li>
  </ul>
</template>
