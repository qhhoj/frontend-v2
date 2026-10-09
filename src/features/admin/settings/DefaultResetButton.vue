<script setup lang="ts">
import { RotateCcw } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';

const props = defineProps<{ defaultText: string; isAtDefault: boolean }>();
const emit = defineEmits<{ reset: [] }>();
const { t } = useI18n();

/** It only fills the box: the user presses "Lưu" like for any edit. */
function requestReset() {
  if (!props.isAtDefault) emit('reset');
}
</script>

<template>
  <!-- aria-disabled, not disabled: the button keeps keyboard focus when the box already holds the default -->
  <button
    type="button"
    class="grid size-11 shrink-0 place-items-center rounded-pill border border-line-strong bg-surface-solid hover:bg-surface-hover aria-disabled:cursor-not-allowed aria-disabled:text-muted"
    :aria-label="t('admin.settings.reset.label', { value: defaultText })"
    :aria-disabled="isAtDefault || undefined"
    @click="requestReset"
  >
    <RotateCcw aria-hidden="true" class="size-4" />
  </button>
</template>
