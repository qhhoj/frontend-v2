<script setup lang="ts">
import AdminLeaveDialog from './AdminLeaveDialog.vue';
import { useDirtyGuard } from './use-dirty-guard';

/** Drop-in unsaved-changes guard for a form inside a route: `<AdminLeaveGuard :dirty-count="dirtyCount" />`. */
const props = defineProps<{ dirtyCount: number }>();
const { isLeaveOpen, leaveAnyway } = useDirtyGuard(() => props.dirtyCount > 0);
</script>

<template>
  <AdminLeaveDialog v-model:visible="isLeaveOpen" :count="dirtyCount" @leave="leaveAnyway" />
</template>
