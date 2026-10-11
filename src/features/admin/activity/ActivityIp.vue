<script setup lang="ts">
import { Check, Copy } from 'lucide-vue-next';
import { computed, onBeforeUnmount, ref } from 'vue';
import { COPIED_FEEDBACK_MS, clipboardAvailable, copyText } from '@/lib/clipboard';
import { shortIp } from './activity';

/** An address cut for the table (`shortIp`); the full one is the tooltip and the copy button's text. */
const props = defineProps<{ ip: string }>();
const isCopied = ref(false);
let resetTimer: ReturnType<typeof setTimeout> | undefined;
const isCut = computed(() => shortIp(props.ip) !== props.ip);

async function copy() {
  if (!(await copyText(props.ip))) return;
  isCopied.value = true;
  clearTimeout(resetTimer);
  resetTimer = setTimeout(() => (isCopied.value = false), COPIED_FEEDBACK_MS);
}
onBeforeUnmount(() => clearTimeout(resetTimer));
</script>

<template>
  <span class="inline-flex max-w-full items-center gap-1">
    <span class="truncate font-mono" :title="isCut ? ip : undefined">{{ shortIp(ip) }}</span>
    <button
      v-if="isCut && clipboardAvailable()"
      type="button"
      class="inline-flex size-6 shrink-0 items-center justify-center rounded-cell text-muted hover:text-content"
      :aria-label="$t('admin.activity.table.copyIp', { ip })"
      :title="ip"
      @click="copy"
    >
      <Check v-if="isCopied" aria-hidden="true" class="size-3.5" />
      <Copy v-else aria-hidden="true" class="size-3.5" />
    </button>
  </span>
</template>
