<script setup lang="ts">
import InlineBit from '@/components/InlineBit.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { errorMessageKey } from '@/i18n/error-message';
import { NOTIFICATION_BITS } from './notification-bits';

defineProps<{ error: unknown }>();
defineEmits<{ retry: [] }>();
</script>

<template>
  <div
    role="alert"
    data-testid="notification-load-error"
    class="flex flex-col items-center gap-2 py-6 text-center"
  >
    <InlineBit :kind="NOTIFICATION_BITS.loadFailed" />
    <strong>{{ $t('notifications.loadFailed') }}</strong>
    <span class="text-muted">{{ $t(errorMessageKey(error)) }}</span>
    <AppButton @click="$emit('retry')">{{ $t('common.retry') }}</AppButton>
  </div>
</template>
