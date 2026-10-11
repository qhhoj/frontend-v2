<script setup lang="ts">
import { computed, watch } from 'vue';
import { deleteProblem } from '@/api/problem-lifecycle.api';
import { translate } from '@/i18n';
import { failureTextOf } from '../../ui/admin-errors';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { PROBLEM_INDEX_KEY, PUBLIC_PROBLEMS_KEY } from '../problem-editing.queries';
import { DELETED_PROBLEMS_KEY, SUBMISSIONS_KEY } from './lifecycle.queries';
import TypedCodeDialog from './TypedCodeDialog.vue';

/** Soft-deletes `code` after its code is typed, with a toast; a refusal stays in the dialog, `deleted` fires once the caches are fresh. */
const props = defineProps<{ code: string }>();
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ deleted: [code: string] }>();
const remove = useAdminMutation({
  mutate: (confirmCode: string) => deleteProblem(props.code, confirmCode),
  invalidates: () => [
    DELETED_PROBLEMS_KEY,
    PROBLEM_INDEX_KEY,
    PUBLIC_PROBLEMS_KEY,
    SUBMISSIONS_KEY,
  ],
  successText: () => translate('admin.problemList.deleted', { code: props.code }),
  onDone: () => {
    visible.value = false;
    emit('deleted', props.code);
  },
});
watch(visible, (isOpen) => {
  if (isOpen) remove.reset();
});
const failureText = computed(() =>
  remove.failure.value ? failureTextOf(remove.failure.value) : '',
);
</script>

<template>
  <TypedCodeDialog
    v-model:visible="visible"
    :code="code"
    :title="$t('admin.lifecycle.danger.title2', { code })"
    :body="$t('admin.lifecycle.danger.dialogBody')"
    :confirm-label="$t('admin.lifecycle.danger.confirm')"
    :busy="remove.isPending.value"
    :failure-text="failureText"
    @confirm="remove.run"
  />
</template>
