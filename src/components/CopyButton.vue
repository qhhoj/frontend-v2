<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { Check, Copy } from 'lucide-vue-next';
import AppButton from '@/components/ui/AppButton.vue';
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
    <AppButton :aria-label="label" @click="copy">
      <template #icon>
        <component
          :is="copied ? Check : Copy"
          aria-hidden="true"
          class="size-4 transition-colors"
          :class="{ 'text-positive': copied }"
        />
      </template>
      <span :class="{ 'max-sm:sr-only': iconOnlyOnPhone }">{{ $t('common.copy') }}</span>
    </AppButton>
    <span class="text-sm text-muted" aria-live="polite">{{
      copied ? $t('common.copied') : ''
    }}</span>
  </span>
</template>
