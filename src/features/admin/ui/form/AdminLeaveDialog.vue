<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ConfirmDialog from '@/components/ConfirmDialog.vue';

/** "Rời trang? 3 thay đổi chưa lưu sẽ mất." on the shared confirm dialog; `count` is optional. */
const props = defineProps<{ count?: number }>();
const isOpen = defineModel<boolean>('visible', { required: true });
defineEmits<{ leave: [] }>();
const { t } = useI18n();
const body = computed(() =>
  props.count ? t('admin.form.leave.body', props.count) : t('admin.form.leave.bodyUncounted'),
);
</script>

<template>
  <ConfirmDialog
    v-model:visible="isOpen"
    tone="danger"
    :title="$t('admin.form.leave.title')"
    :body="body"
    :confirm-label="$t('admin.form.leave.leave')"
    :cancel-label="$t('admin.form.leave.stay')"
    @confirm="$emit('leave')"
  />
</template>
