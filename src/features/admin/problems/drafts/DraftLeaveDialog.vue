<script setup lang="ts">
import AdminLeaveDialog from '../../ui/form/AdminLeaveDialog.vue';

/** Deprecated: `AdminLeaveDialog` (ui/form) without a count; kept for the tabs not yet on `AdminLeaveGuard`. */
const isOpen = defineModel<boolean>('visible', { required: true });
defineEmits<{ leave: [] }>();
</script>

<template>
  <AdminLeaveDialog v-model:visible="isOpen" @leave="$emit('leave')" />
</template>
