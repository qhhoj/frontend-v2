<script setup lang="ts">
import RowMenu from '@/components/ui/RowMenu.vue';
import type { RowMenuItem } from '@/components/ui/RowMenu.vue';

export type { RowMenuItem };

/** The admin row menu: the kit `RowMenu`, kept under its old name for the admin lists. */
defineProps<{ items: RowMenuItem[]; label: string }>();
</script>

<template>
  <RowMenu :items="items" :label="label" />
</template>
