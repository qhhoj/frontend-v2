<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import AdminField from '../../ui/AdminField.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { INPUT } from '../../ui/controls';

/**
 * Type-the-code confirm for an irreversible step (delete, purge now): the confirm stays `aria-disabled` and Enter does
 * nothing until the typed text is exactly `code` (no trimming, case counts). A refusal shows inside the dialog.
 */
const props = withDefaults(
  defineProps<{
    code: string;
    title: string;
    body: string;
    confirmLabel: string;
    busy?: boolean;
    failureText?: string;
  }>(),
  { busy: false, failureText: '' },
);
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ confirm: [typed: string] }>();
const typed = ref('');
const isExact = computed(() => typed.value === props.code);
watch(visible, (isOpen) => {
  if (isOpen) typed.value = '';
});
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    :title="title"
    :body="body"
    :confirm-label="confirmLabel"
    tone="danger"
    :busy="busy"
    :can-confirm="isExact"
    @confirm="emit('confirm', typed)"
  >
    <AdminField
      v-slot="{ id, describedBy }"
      input-id="typed-problem-code"
      :label="$t('admin.lifecycle.typeCode', { code })"
    >
      <input
        :id="id"
        v-model="typed"
        :class="INPUT"
        class="font-mono"
        :aria-describedby="describedBy"
        autocomplete="off"
        spellcheck="false"
      />
    </AdminField>
    <template #error>
      <AdminStatus v-if="failureText" kind="refused" :text="failureText" />
    </template>
  </ConfirmDialog>
</template>
