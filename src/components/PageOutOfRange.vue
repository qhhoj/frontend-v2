<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import type { NumberedPageMeta } from '@/api/client';
import EmptyState from '@/components/EmptyState.vue';
import { fallbackPageOf, queryWithPage } from '@/lib/paging';

/** What an empty page shows when earlier pages exist: it says the page is past the end and links to a page with rows. Renders nothing on a page that is simply empty. */
const props = withDefaults(
  defineProps<{ meta: NumberedPageMeta; rowCount: number; queryKey?: string }>(),
  { queryKey: 'page' },
);
const route = useRoute();
const target = computed(() => fallbackPageOf(props.meta, props.rowCount));
const to = computed(() => ({
  query: queryWithPage(route.query, props.queryKey, target.value ?? 1),
}));
</script>

<template>
  <EmptyState v-if="target !== null" data-testid="page-out-of-range">
    {{ $t('pager.outOfRange', { page: meta.page }) }}
    <template #action>
      <RouterLink
        :to="to"
        class="inline-flex min-h-11 items-center font-semibold text-accent-text underline"
      >
        {{ $t(target === 1 ? 'pager.toFirst' : 'pager.toLast', { page: target }) }}
      </RouterLink>
    </template>
  </EmptyState>
</template>
