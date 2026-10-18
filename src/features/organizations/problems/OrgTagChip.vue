<script setup lang="ts">
import type { ProblemTag } from '@/api/types/organization-problems';
import { TAG_CHIP_CLASSES } from './org-tag-classes';

/** A tag as a chip: the colour is a token, the name is always written (colour is never the only signal). */
defineProps<{ tag: Pick<ProblemTag, 'name' | 'color'> }>();
</script>

<template>
  <span
    class="inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"
    :class="TAG_CHIP_CLASSES[tag.color]"
    >{{ tag.name }}</span
  >
</template>
