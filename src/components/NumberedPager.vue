<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import type { NumberedPageMeta } from '@/api/client';
import { lastPageOf, pageWindow } from '@/lib/paging';

/** Numbered page links (`?page=`, or the given `queryKey`), keeping every other query key; hidden when one page holds everything. */
const props = withDefaults(
  defineProps<{ meta: NumberedPageMeta; label: string; queryKey?: string }>(),
  {
    queryKey: 'page',
  },
);
const route = useRoute();
const last = computed(() => lastPageOf(props.meta));
const slots = computed(() => pageWindow(props.meta.page, last.value));
const hasPrevious = computed(() => props.meta.page > 1);
const hasNext = computed(() => props.meta.page < last.value);
const linkTo = (page: number) => {
  const kept = Object.fromEntries(
    Object.entries(route.query).filter(([key]) => key !== props.queryKey),
  );
  return { query: page === 1 ? kept : { ...kept, [props.queryKey]: String(page) } };
};
const CELL =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-pill px-3 font-semibold';
// A disabled arrow keeps its shape but reads as muted text with no hover fill (token colours only, no opacity).
const ARROW = `${CELL} border border-line text-content hover:bg-surface-hover aria-disabled:cursor-not-allowed aria-disabled:bg-transparent aria-disabled:text-muted aria-disabled:hover:bg-transparent`;
</script>

<template>
  <nav
    v-if="last > 1"
    :aria-label="label"
    class="flex flex-wrap items-center justify-center gap-1.5"
  >
    <RouterLink v-if="hasPrevious" v-slot="{ href, navigate }" custom :to="linkTo(meta.page - 1)">
      <a :href="href" :aria-label="$t('pager.previous')" :class="ARROW" @click="navigate">
        <ChevronLeft aria-hidden="true" class="size-4" />
      </a>
    </RouterLink>
    <span v-else role="link" :aria-label="$t('pager.previous')" aria-disabled="true" :class="ARROW">
      <ChevronLeft aria-hidden="true" class="size-4" />
    </span>
    <template v-for="(slot, index) in slots" :key="index">
      <span v-if="slot === 'gap'" aria-hidden="true" class="px-1 text-muted">…</span>
      <RouterLink v-else v-slot="{ href, navigate }" custom :to="linkTo(slot)">
        <a
          :href="href"
          :aria-current="slot === meta.page ? 'page' : undefined"
          :class="[
            CELL,
            slot === meta.page ? 'bg-accent-soft text-accent-soft-text' : 'hover:bg-surface-hover',
          ]"
          @click="navigate"
        >
          {{ slot }}
        </a>
      </RouterLink>
    </template>
    <RouterLink v-if="hasNext" v-slot="{ href, navigate }" custom :to="linkTo(meta.page + 1)">
      <a :href="href" :aria-label="$t('pager.next')" :class="ARROW" @click="navigate">
        <ChevronRight aria-hidden="true" class="size-4" />
      </a>
    </RouterLink>
    <span v-else role="link" :aria-label="$t('pager.next')" aria-disabled="true" :class="ARROW">
      <ChevronRight aria-hidden="true" class="size-4" />
    </span>
  </nav>
</template>
