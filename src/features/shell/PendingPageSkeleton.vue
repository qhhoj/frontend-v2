<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import Card from '@/components/ui/Card.vue';

/**
 * The page skeleton of the optimistic shell (D-08), shown while the first navigation waits for the session: a `PageHeader`
 * title and meta line over a card of list rows, the shape most pages open with. The page then mounts with its own skeleton.
 */
const ROW_COUNT = 6;
</script>

<template>
  <div class="page-column" aria-hidden="true" data-testid="pending-page-skeleton">
    <div>
      <p class="page-title"><SkeletonBlock text class="w-48 max-w-full" /></p>
      <p class="mt-1 text-meta"><SkeletonBlock text class="w-72 max-w-full" /></p>
    </div>
    <Card padding="md">
      <div
        v-for="row in ROW_COUNT"
        :key="row"
        class="flex items-center gap-3 border-t border-line py-3 first:border-t-0 first:pt-0 last:pb-0"
      >
        <div class="min-w-0 flex-1 text-sm">
          <SkeletonBlock text class="w-56 max-w-full" />
        </div>
        <span class="text-sm"><SkeletonBlock text class="w-12" /></span>
      </div>
    </Card>
  </div>
</template>
