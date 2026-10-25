<script setup lang="ts">
import type { ProblemTag } from '@/api/types/organization-problems';
import { TAG_CHIP_CLASSES } from './org-tag-classes';

/**
 * A tag as a chip: the colour is a token, the name is always written (colour is never the only signal). A name is up to
 * 40 characters, so the chip never outgrows its row: it wraps, even inside a word.
 */
defineProps<{ tag: Pick<ProblemTag, 'name' | 'color'> }>();
</script>

<template>
  <span
    class="inline-flex max-w-full items-center rounded-pill px-2.5 py-0.5 text-caption leading-4 font-semibold [overflow-wrap:anywhere]"
    :class="TAG_CHIP_CLASSES[tag.color]"
    >{{ tag.name }}</span
  >
</template>
