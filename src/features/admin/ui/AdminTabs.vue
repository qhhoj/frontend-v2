<script setup lang="ts">
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { useRoute } from 'vue-router';

export interface AdminTab {
  key: string;
  labelKey: string;
  to: RouteLocationRaw;
  /** A count chip after the label; hidden while null or absent. */
  count?: number | null;
}

/** Underlined tabs that switch a page's sections: by route (`key` is the route name, the default `current`) or by query. */
const props = defineProps<{ tabs: AdminTab[]; label: string; current?: string }>();
const route = useRoute();
const currentKey = computed(() => props.current ?? String(route.name));
</script>

<template>
  <nav :aria-label="label" class="-mx-4 overflow-x-auto px-4">
    <ul class="flex min-w-max gap-1 border-b border-line">
      <li v-for="tab in tabs" :key="tab.key">
        <RouterLink
          :to="tab.to"
          class="inline-flex min-h-11 items-center gap-2 border-b-2 border-transparent px-3 text-sm font-semibold text-muted hover:text-content focus-visible:-outline-offset-2 aria-[current=page]:border-accent aria-[current=page]:text-content"
          :aria-current="tab.key === currentKey ? 'page' : undefined"
        >
          {{ $t(tab.labelKey) }}
          <span
            v-if="tab.count !== undefined && tab.count !== null"
            class="rounded-pill bg-surface-strong px-2 text-xs"
            >{{ tab.count }}</span
          >
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
