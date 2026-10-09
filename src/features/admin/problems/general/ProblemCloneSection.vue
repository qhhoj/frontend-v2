<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { translate } from '@/i18n';
import { cloneProblem } from '@/api/problem-editing.api';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import AdminField from '../../ui/AdminField.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { ADMIN_BUTTON_CLASS, ADMIN_INPUT_CLASS } from '../../ui/classes';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { PROBLEM_CODE_PATTERN } from '../problem-code';

const props = defineProps<{ code: string }>();
const newCode = ref('');
const createdCode = ref('');
const clone = useAdminMutation({
  mutate: (target: string) => cloneProblem(props.code, target),
  onDone: (result) => {
    createdCode.value = result.code;
  },
});
const localCodeError = ref('');
const codeError = computed(() => localCodeError.value || clone.fieldErrors.value.code);

/** A typed code retires the last answer and its message: the box describes what is typed now. */
watch(newCode, () => {
  localCodeError.value = '';
  clone.reset();
});

/** Cloning is its own action, outside the save form: Enter in the box clones, it never saves the problem. A code the backend would refuse is never sent. */
function submit() {
  if (!newCode.value) return;
  if (!PROBLEM_CODE_PATTERN.test(newCode.value)) {
    localCodeError.value = translate('admin.problems.general.errors.code');
    return;
  }
  void clone.run(newCode.value);
}
</script>

<template>
  <SettingsCard :title="$t('admin.problems.clone.title')">
    <div class="flex flex-wrap items-end gap-2">
      <AdminField
        v-slot="{ id, describedBy }"
        input-id="problem-clone-code"
        class="min-w-60 flex-1"
        :label="$t('admin.problems.clone.code')"
        :hint="$t('admin.problems.clone.hint')"
        :error="codeError"
      >
        <input
          :id="id"
          v-model.trim="newCode"
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
          :aria-invalid="codeError ? 'true' : undefined"
          autocomplete="off"
          @keydown.enter.prevent="submit"
        />
      </AdminField>
      <button
        type="button"
        :class="ADMIN_BUTTON_CLASS"
        :aria-disabled="clone.isPending.value ? 'true' : undefined"
        @click="submit"
      >
        {{ $t('admin.problems.clone.submit') }}
      </button>
    </div>
    <AdminStatus v-if="clone.isDone.value" kind="done" :text="$t('admin.problems.clone.done')">
      <RouterLink
        v-if="createdCode"
        :to="{ name: 'admin-problemGeneral', params: { code: createdCode } }"
        class="font-semibold text-accent-text underline"
      >
        {{ $t('admin.problems.clone.open', { code: createdCode }) }}
      </RouterLink>
    </AdminStatus>
  </SettingsCard>
</template>
