<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/** The loading rows of any group: the shape of `ContestRow.vue` (name, facts, the cue at the right), one hairline under each. */
const props = withDefaults(defineProps<{ rows?: number }>(), { rows: 3 });
</script>

<template>
  <ul aria-hidden="true" class="m-0 list-none p-0">
    <li
      v-for="row in props.rows"
      :key="row"
      data-skeleton-region="contest-row"
      class="flex min-h-(--qh-row) flex-wrap items-center gap-x-4 gap-y-1 border-b border-line py-2"
    >
      <div class="min-w-0 basis-full md:flex-1 md:basis-0"><SkeletonBlock text class="w-48" /></div>
      <p class="flex-1 font-mono text-meta md:w-72 md:flex-none">
        <SkeletonBlock text class="w-56" />
      </p>
      <p class="md:w-36"><SkeletonBlock text class="ml-auto w-20" /></p>
    </li>
  </ul>
</template>
