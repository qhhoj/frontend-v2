<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import CopyButton from '@/components/CopyButton.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { ADMIN_BUTTON_CLASS } from '../ui/classes';

/**
 * Shows an auth key once. Nothing dismisses it (Escape, the mask, the close button) until "saved" is checked. The parent mounts it
 * only while a key is held (`v-if`), so closing unmounts the dialog and the key leaves every ref with the component.
 */
defineProps<{ header: string; authKey: string }>();
const emit = defineEmits<{ close: [] }>();
const isOpen = ref(true);
const isSaved = ref(false);

/** Only the saved check and the close button lead here; Escape and the mask are switched off on the Dialog. */
function close() {
  if (isSaved.value) isOpen.value = false;
}
watch(isOpen, (open) => {
  if (!open) emit('close');
});
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
