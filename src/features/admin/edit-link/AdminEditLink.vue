<script setup lang="ts">
import { Pencil } from 'lucide-vue-next';
import type { RouteLocationRaw } from 'vue-router';
import IconButton from '@/components/ui/IconButton.vue';

/**
 * "Edit in admin" quick link for a public page's header action row: a small icon-only pencil at every width.
 * `to` is null when the viewer cannot edit the object (see `admin-edit-targets.ts`): nothing renders.
 * A compact kit `IconButton`: 32 px with a larger hit area, 44 px on touch.
 */
defineProps<{ to: RouteLocationRaw | null }>();
</script>

<template>
  <IconButton
    v-if="to"
    :to="to"
    tone="secondary"
    compact
    :label="$t('adminEdit.label')"
    data-testid="admin-edit-link"
  >
    <Pencil aria-hidden="true" />
  </IconButton>
</template>
