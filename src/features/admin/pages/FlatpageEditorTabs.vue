<script setup lang="ts">
import { useRoute } from 'vue-router';

/** `hasHistory` is false for a page not saved yet; `historyTotal` is null while the count is unknown (loading or failed). */
defineProps<{ active: 'edit' | 'history'; hasHistory: boolean; historyTotal: number | null }>();
const route = useRoute();
const TAB_CLASS =
  'inline-flex min-h-11 items-center gap-2 border-b-2 border-transparent px-3 text-sm font-semibold text-muted hover:text-content aria-[current=page]:border-accent aria-[current=page]:text-content';
</script>

<template>
  <nav
    data-testid="editor-tabs"
    :aria-label="$t('admin.pages.tabs.label')"
    class="-mx-4 overflow-x-auto px-4"
  >
    <ul class="flex min-w-max gap-1 border-b border-line">
      <li>
        <RouterLink
          :to="{ query: { ...route.query, tab: undefined, hp: undefined } }"
          :class="TAB_CLASS"
          :aria-current="active === 'edit' ? 'page' : undefined"
          >{{ $t('admin.pages.tabs.edit') }}</RouterLink
        >
      </li>
      <li v-if="hasHistory">
        <RouterLink
          :to="{ query: { ...route.query, tab: 'history' } }"
          :class="TAB_CLASS"
          :aria-current="active === 'history' ? 'page' : undefined"
        >
          {{ $t('admin.pages.tabs.history') }}
          <span v-if="historyTotal !== null" class="rounded-pill bg-surface-strong px-2 text-xs">{{
            historyTotal
          }}</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
