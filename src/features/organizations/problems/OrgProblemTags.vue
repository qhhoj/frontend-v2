<script setup lang="ts">
import type { ProblemTag } from '@/api/types/organization-problems';
import OrgTagChip from './OrgTagChip.vue';

/**
 * A problem's tags as a wrapping row of chips. `oneLine` (a table cell): from `sm` only the first tag shows and the rest
 * are counted ("+2", all named in the tooltip), so the tags never squeeze the problem's name; a phone card shows them all.
 */
defineProps<{ tags: Pick<ProblemTag, 'id' | 'name' | 'color'>[]; oneLine?: boolean }>();
</script>

<template>
  <span
    class="flex flex-wrap items-center gap-1.5"
    :class="oneLine && 'sm:flex-nowrap'"
    :title="oneLine ? tags.map((tag) => tag.name).join(', ') : undefined"
  >
    <OrgTagChip
      v-for="(tag, index) in tags"
      :key="tag.id"
      :tag="tag"
      :class="oneLine && index > 0 && 'sm:hidden'"
    />
    <span v-if="oneLine && tags.length > 1" class="text-small text-muted max-sm:hidden"
      >+{{ tags.length - 1 }}</span
    >
  </span>
</template>
