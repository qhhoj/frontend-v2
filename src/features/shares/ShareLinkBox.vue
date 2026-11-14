<script setup lang="ts">
import { Check, Copy } from 'lucide-vue-next';
import { computed, onBeforeUnmount, ref } from 'vue';
import AppButton from '@/components/ui/AppButton.vue';
import TextInput from '@/components/ui/TextInput.vue';
import { COPIED_FEEDBACK_MS, copyText } from '@/lib/clipboard';
import { displayShareUrl, shareUrl } from './share-url';

/** A link as text in a read-only field (selected on focus, so a blocked clipboard still works by hand) with its copy button. */
const props = defineProps<{ code: string }>();
const url = computed(() => shareUrl(props.code));
const isCopied = ref(false);
let resetTimer: ReturnType<typeof setTimeout> | undefined;

async function copy() {
  if (!(await copyText(url.value))) return;
  isCopied.value = true;
  clearTimeout(resetTimer);
  resetTimer = setTimeout(() => (isCopied.value = false), COPIED_FEEDBACK_MS);
}
const selectAll = (event: FocusEvent) => (event.target as HTMLInputElement).select();
onBeforeUnmount(() => clearTimeout(resetTimer));
</script>

<template>
  <div class="flex flex-col gap-2">
    <TextInput
      readonly
      class="font-mono"
      data-testid="share-url"
      :model-value="displayShareUrl(url)"
      :aria-label="$t('share.link.label')"
      @focus="selectAll"
    />
    <AppButton
      tone="primary"
      block
      data-testid="share-copy"
      :pressed="isCopied || undefined"
      @click="copy"
    >
      <template #icon>
        <Check v-if="isCopied" aria-hidden="true" class="size-4" />
        <Copy v-else aria-hidden="true" class="size-4" />
      </template>
      {{ isCopied ? $t('common.copied') : $t('share.link.copy') }}
    </AppButton>
    <p class="sr-only" aria-live="polite">{{ isCopied ? $t('common.copied') : '' }}</p>
  </div>
</template>
