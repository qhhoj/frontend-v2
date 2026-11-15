<script setup lang="ts">
import { Share2 } from 'lucide-vue-next';
import { nextTick, ref, watch } from 'vue';
import AppButton from '@/components/ui/AppButton.vue';
import ShareDialog from './ShareDialog.vue';

/** "Chia sẻ" beside "Nộp lại": opens the share dialog of one submission. The page shows it only when `viewer.canShare` is true. */
defineProps<{ submissionId: string }>();
const isOpen = ref(false);
const button = ref<{ $el: HTMLElement } | null>(null);
/** The dialog is unmounted on close, so the opener takes focus back itself. */
watch(isOpen, (open) => {
  if (!open) void nextTick(() => button.value?.$el.focus());
});
</script>

<template>
  <AppButton ref="button" data-testid="share-button" aria-haspopup="dialog" @click="isOpen = true">
    <template #icon><Share2 aria-hidden="true" class="size-4" /></template>
    {{ $t('share.button') }}
  </AppButton>
  <ShareDialog v-if="isOpen" v-model:visible="isOpen" :submission-id="submissionId" />
</template>
