<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { Copy } from 'lucide-vue-next';
import { COPIED_FEEDBACK_MS, clipboardAvailable, copyText } from '@/lib/clipboard';

/** `iconOnlyOnPhone` drops the visible word below `sm`; the label stays for assistive tech. */
const props = defineProps<{ text: string; label: string; iconOnlyOnPhone?: boolean }>();
const copied = ref(false);
let resetTimer: ReturnType<typeof setTimeout> | undefined;

async function copy() {
  if (!(await copyText(props.text))) return;
  copied.value = true;
  clearTimeout(resetTimer);
  resetTimer = setTimeout(() => (copied.value = false), COPIED_FEEDBACK_MS);
}

onBeforeUnmount(() => clearTimeout(resetTimer));
</script>

<template>
  <span v-if="clipboardAvailable()" class="inline-flex items-center gap-2">
    <button
      type="button"
      class="inline-flex min-h-11 items-center gap-2 rounded-pill border border-line-strong bg-surface-solid px-4 text-sm font-semibold text-content"
      :aria-label="label"
      @click="copy"
    >
      <Copy aria-hidden="true" class="size-4" />
      <span :class="{ 'max-sm:sr-only': iconOnlyOnPhone }">{{ $t('common.copy') }}</span>
    </button>
    <span class="text-sm text-muted" aria-live="polite">{{
      copied ? $t('common.copied') : ''
    }}</span>
  </span>
</template>
