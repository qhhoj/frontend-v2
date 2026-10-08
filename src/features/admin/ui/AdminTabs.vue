<script setup lang="ts">
import type { RouteParamsRaw } from 'vue-router';

defineProps<{
  tabs: { routeName: string; labelKey: string }[];
  params: RouteParamsRaw;
  label: string;
}>();
</script>

<template>
  <nav :aria-label="label" class="-mx-4 overflow-x-auto px-4">
    <ul class="flex min-w-max gap-1 border-b border-line">
      <li v-for="tab in tabs" :key="tab.routeName">
        <RouterLink
          :to="{ name: tab.routeName, params }"
          class="inline-flex min-h-11 items-center border-b-2 border-transparent px-3 text-sm font-semibold text-muted hover:text-content"
          exact-active-class="!border-accent !text-content"
          :aria-current="$route.name === tab.routeName ? 'page' : undefined"
        >
          {{ $t(tab.labelKey) }}
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
