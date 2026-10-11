<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { cloneProblem } from '@/api/problem-editing.api';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { translate } from '@/i18n';
import AdminField from '../../ui/AdminField.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { INPUT } from '../../ui/controls';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { PROBLEM_INDEX_KEY, PUBLIC_PROBLEMS_KEY } from '../problem-editing.queries';
import { PROBLEM_CODE_PATTERN } from '../problem-code';

/**
 * "Nhân bản bài…" from the editor header: the new code in a dialog of its own (never the save form, so Enter clones and
 * never saves). A copy opens at once in the editor; a code the backend would refuse is never sent.
 */
const props = defineProps<{ code: string }>();
const visible = defineModel<boolean>('visible', { required: true });
const router = useRouter();
const newCode = ref('');
const localCodeError = ref('');
const clone = useAdminMutation({
  mutate: (target: string) => cloneProblem(props.code, target),
  invalidates: () => [PUBLIC_PROBLEMS_KEY, PROBLEM_INDEX_KEY],
  successText: (copy) => translate('admin.problems.clone.doneToast', { code: copy.code }),
  onDone: (copy) => {
    visible.value = false;
    void router.push({ name: 'admin-problemGeneral', params: { code: copy.code } });
  },
});
const codeError = computed(() => localCodeError.value || clone.fieldErrors.value.code);
const pageFailure = computed(() =>
  clone.failure.value && !clone.fieldErrors.value.code ? failureTextOf(clone.failure.value) : '',
);

watch(visible, (isOpen) => {
  if (!isOpen) return;
  newCode.value = '';
  clone.reset();
});
/** A typed code retires the last answer and its message: the box describes what is typed now. */
watch(newCode, () => {
  localCodeError.value = '';
  clone.reset();
});

function submit() {
  if (!PROBLEM_CODE_PATTERN.test(newCode.value)) {
    localCodeError.value = translate('admin.problems.general.errors.code');
    return;
  }
  void clone.run(newCode.value);
}
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    :title="$t('admin.problems.clone.title', { code })"
    :confirm-label="$t('admin.problems.clone.submit')"
    :busy="clone.isPending.value"
    :can-confirm="newCode.length > 0"
    @confirm="submit"
  >
    <AdminField
      v-slot="{ id, describedBy, invalid }"
      input-id="problem-clone-code"
      :label="$t('admin.problems.clone.code')"
      :hint="$t('admin.problems.clone.hint')"
      :error="codeError"
      required
    >
      <input
        :id="id"
        v-model.trim="newCode"
        :class="[INPUT, 'font-mono']"
        :aria-describedby="describedBy"
        :aria-invalid="invalid === 'true'"
        autocomplete="off"
        spellcheck="false"
      />
    </AdminField>
    <template #error>
      <AdminStatus v-if="pageFailure" kind="refused" :text="pageFailure" />
    </template>
  </ConfirmDialog>
</template>
