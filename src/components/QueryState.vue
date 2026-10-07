<script setup lang="ts">
import { errorMessageKey } from '@/i18n/error-message';

defineProps<{ loading: boolean; error: unknown }>();
defineEmits<{ retry: [] }>();
</script>

<template>
  <p v-if="loading" role="status" class="py-6 text-center text-muted">{{ $t('common.loading') }}</p>
  <div
    v-else-if="error"
    role="alert"
    class="flex flex-wrap items-center justify-center gap-3 py-6 text-center"
  >
    <span>{{ $t(errorMessageKey(error)) }}</span>
    <button
      type="button"
      class="min-h-11 rounded-pill border border-line px-4 font-semibold hover:bg-surface-hover"
      @click="$emit('retry')"
    >
      {{ $t('common.retry') }}
    </button>
  </div>
  <slot v-else />
</template>
