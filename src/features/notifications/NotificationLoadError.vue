<script setup lang="ts">
import InlineBit from '@/components/InlineBit.vue';
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
    <button
      type="button"
      class="min-h-11 rounded-pill border border-line px-4 font-semibold hover:bg-surface-hover"
      @click="$emit('retry')"
    >
      {{ $t('common.retry') }}
    </button>
  </div>
</template>
