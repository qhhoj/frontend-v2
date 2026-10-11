<script setup lang="ts">
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { useRoute } from 'vue-router';

export interface AdminTab {
  key: string;
  labelKey: string;
  to: RouteLocationRaw;
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
          class="inline-flex min-h-11 items-center border-b-2 border-transparent px-3 text-sm font-semibold text-muted hover:text-content focus-visible:-outline-offset-2 aria-[current=page]:border-accent aria-[current=page]:text-content"
          :aria-current="tab.key === currentKey ? 'page' : undefined"
        >
          {{ $t(tab.labelKey) }}
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
