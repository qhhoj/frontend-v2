<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';

/**
 * The "Xem thêm" button under a thread read top to bottom (comments): it asks for the next batch and is gone once
 * nothing is left. While the batch loads it keeps its label and focus and shows a spinner (`AppButton loading`).
 * Lists people scan or come back to page through `NumberedPager` instead (`stepper` when the total is unknown).
 */
withDefaults(defineProps<{ hasMore: boolean; pending?: boolean; label?: string }>(), {
  pending: false,
  label: undefined,
});
const emit = defineEmits<{ more: [] }>();
</script>

<template>
  <div v-if="hasMore" class="flex justify-center">
    <AppButton :loading="pending" :aria-busy="pending" @click="emit('more')">
      {{ label ?? $t('pager.loadMore') }}
    </AppButton>
  </div>
</template>
