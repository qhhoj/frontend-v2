<script setup lang="ts">
import { Pencil } from 'lucide-vue-next';
import type { RouteLocationRaw } from 'vue-router';

/**
 * "Edit in admin" quick link for a public page's header action row: a small icon-only pencil at every width.
 * `to` is null when the viewer cannot edit the object (see `admin-edit-targets.ts`): nothing renders.
 * The 32 px visual keeps a 44 px touch target through the invisible `before` box.
 */
defineProps<{ to: RouteLocationRaw | null }>();
</script>

<template>
  <RouterLink
    v-if="to"
    :to="to"
    data-testid="admin-edit-link"
    :aria-label="$t('adminEdit.label')"
    :title="$t('adminEdit.label')"
    class="relative inline-flex size-8 shrink-0 items-center justify-center rounded-pill border border-line-strong bg-surface-solid text-content before:absolute before:-inset-1.5 before:content-[''] hover:bg-surface-hover"
  >
    <Pencil aria-hidden="true" class="size-4" />
  </RouterLink>
</template>
