<script setup lang="ts">
import type { ProblemTag } from '@/api/types/organization-problems';
import OrgTagChip from './OrgTagChip.vue';

/** A problem's tags as a wrapping row of chips. */
defineProps<{ tags: Pick<ProblemTag, 'id' | 'name' | 'color'>[] }>();
</script>

<template>
  <span class="flex flex-wrap gap-1.5">
    <OrgTagChip v-for="tag in tags" :key="tag.id" :tag="tag" />
  </span>
</template>
