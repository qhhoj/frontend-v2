<script setup lang="ts">
import { Pencil } from 'lucide-vue-next';
import type { RouteLocationRaw } from 'vue-router';
import IconButton from '@/components/ui/IconButton.vue';

/** A pencil to an item's editor, beside the item in a list; show it only where the backend says the viewer may edit. */
defineProps<{ to: RouteLocationRaw; label: string }>();
</script>

<template>
  <IconButton size="sm" :label="label" :to="to">
    <Pencil class="size-4" :stroke-width="1.75" />
  </IconButton>
</template>
