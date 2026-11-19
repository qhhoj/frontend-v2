<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import FormField from '@/components/ui/FormField.vue';
import TextInput from '@/components/ui/TextInput.vue';
import AdminStatus from '../ui/AdminStatus.vue';

/** Asks for the new name of an offline judge; the judge reconnects only once its config uses that name. */
const props = defineProps<{ judgeName: string; isBusy: boolean; failureText: string | null }>();
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ confirm: [newName: string] }>();
const newName = ref('');
/** Each opening starts from the current name, so a small fix needs no retyping. */
watch(visible, (isVisible) => {
  if (isVisible) newName.value = props.judgeName;
});
const canConfirm = computed(() => {
  const name = newName.value.trim();
  return name !== '' && name !== props.judgeName;
});
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    :title="$t('admin.judges.rename.title', { name: judgeName })"
    :body="$t('admin.judges.rename.body')"
    :confirm-label="$t('admin.judges.rename.confirm')"
    :busy="isBusy"
    :can-confirm="canConfirm"
    @confirm="emit('confirm', newName.trim())"
  >
    <FormField :label="$t('admin.judges.rename.label')" :hint="$t('admin.judges.add.nameHint')">
      <TextInput v-model="newName" autocomplete="off" spellcheck="false" />
    </FormField>
    <template v-if="failureText" #error>
      <AdminStatus kind="refused" :text="failureText" />
    </template>
  </ConfirmDialog>
</template>
