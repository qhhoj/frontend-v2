<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import { useToast } from '@/components/ui/use-toast';
import { translate } from '@/i18n';
import { errorMessageKey } from '@/i18n/error-message';
import { useMarkAllRead } from './notifications.queries';

/**
 * The one "Đánh dấu tất cả đã đọc" control, on the page and in the bell's drawer: the same label, a toast when it worked
 * and `failed` (the message key) when it did not, so the caller shows the cause beside its list. A second click while the
 * request runs does nothing.
 */
withDefaults(defineProps<{ tone?: 'secondary' | 'link' }>(), { tone: 'secondary' });
const emit = defineEmits<{ failed: [messageKey: string | null] }>();
const markAll = useMarkAllRead();
const toast = useToast();

function markAllRead() {
  if (markAll.isPending.value) return;
  emit('failed', null);
  markAll.mutate(undefined, {
    onSuccess: () => toast.show({ text: translate('notifications.readAllDone'), tone: 'success' }),
    onError: (error) => emit('failed', errorMessageKey(error)),
  });
}
</script>

<template>
  <AppButton :tone="tone" :loading="markAll.isPending.value" @click="markAllRead">
    {{ $t('notifications.readAllLong') }}
  </AppButton>
</template>
