<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import CopyButton from '@/components/CopyButton.vue';
import AdminStatus from './AdminStatus.vue';
import { ADMIN_BUTTON_CLASS } from './classes';

/** The texts of one reveal-once dialog (judge keys, integration keys). */
interface RevealKeyTexts {
  warning: string;
  label: string;
  saved: string;
  close: string;
  copy: string;
}

/**
 * Shows a secret once. Nothing dismisses it (Escape, the mask, the close button) until "saved" is checked. The dialog stays
 * mounted so PrimeVue returns focus to the opener when it hides; the parent keeps the key only while `visible`.
 */
const props = defineProps<{
  visible: boolean;
  header: string;
  authKey: string;
  texts: RevealKeyTexts;
}>();
const emit = defineEmits<{ close: [] }>();
const isSaved = ref(false);
/** Escape and the mask would also reach this setter; the Dialog switches them off, so only the close button gets here. */
const isOpen = computed({
  get: () => props.visible,
  set: (open: boolean) => {
    if (!open) emit('close');
  },
});

watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible) isSaved.value = false;
  },
);

/** Focus starts on the saved box, so the key is read and acknowledged before the close button is reached. */
function focusSavedBox() {
  document.getElementById('key-saved')?.focus();
}

function close() {
  if (isSaved.value) isOpen.value = false;
}
</script>

<template>
  <Dialog
    v-model:visible="isOpen"
    modal
    :header="header"
    :draggable="false"
    :closable="false"
    :close-on-escape="false"
    :dismissable-mask="false"
    @show="focusSavedBox"
  >
    <div class="flex flex-col gap-4">
      <AdminStatus kind="security" :text="texts.warning" />
      <div class="flex flex-col gap-2">
        <span id="reveal-key-label" class="text-sm font-semibold">{{ texts.label }}</span>
        <code
          aria-labelledby="reveal-key-label"
          class="rounded-row border border-line bg-surface-solid p-3 font-mono break-all"
          >{{ authKey }}</code
        >
        <div>
          <CopyButton :text="authKey" :label="texts.copy" />
        </div>
      </div>
      <label class="flex items-center gap-2">
        <input id="key-saved" v-model="isSaved" type="checkbox" class="size-5" />
        {{ texts.saved }}
      </label>
    </div>
    <template #footer>
      <button
        type="button"
        data-testid="key-close"
        :class="ADMIN_BUTTON_CLASS"
        :aria-disabled="!isSaved || undefined"
        @click="close"
      >
        {{ texts.close }}
      </button>
    </template>
  </Dialog>
</template>
