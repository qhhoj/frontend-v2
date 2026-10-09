<script setup lang="ts">
import ConfirmDialog from '@/components/ConfirmDialog.vue';

const isOpen = defineModel<boolean>('visible', { required: true });
defineEmits<{ leave: [] }>();
</script>

<template>
  <ConfirmDialog
    v-model:visible="isOpen"
    :title="$t('admin.problems.drafts.leaveTitle')"
    :body="$t('admin.problems.drafts.leaveBody')"
    :confirm-label="$t('admin.problems.drafts.leave')"
    :cancel-label="$t('admin.problems.drafts.stay')"
    @confirm="$emit('leave')"
  />
</template>
