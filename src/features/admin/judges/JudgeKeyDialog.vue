<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import CopyButton from '@/components/CopyButton.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { ADMIN_BUTTON_CLASS } from '../ui/classes';

/**
 * Shows an auth key once. Nothing dismisses it (Escape, the mask, the close button) until "saved" is checked. The dialog stays
 * mounted so PrimeVue returns focus to the opener when it hides; the parent keeps the key only while `visible`.
 */
const props = defineProps<{ visible: boolean; header: string; authKey: string }>();
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
      <AdminStatus kind="security" :text="$t('admin.judges.key.warning')" />
      <div class="flex flex-col gap-2">
        <span id="judge-key-label" class="text-sm font-semibold">
          {{ $t('admin.judges.key.label') }}
        </span>
        <code
          aria-labelledby="judge-key-label"
          class="rounded-row border border-line bg-surface-solid p-3 font-mono break-all"
          >{{ authKey }}</code
        >
        <div>
          <CopyButton :text="authKey" :label="$t('admin.judges.key.copy')" />
        </div>
      </div>
      <label class="flex items-center gap-2">
        <input id="key-saved" v-model="isSaved" type="checkbox" class="size-5" />
        {{ $t('admin.judges.key.saved') }}
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
        {{ $t('admin.judges.key.close') }}
      </button>
    </template>
  </Dialog>
</template>
