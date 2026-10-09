<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { createProblem, suggestProblem } from '@/api/problem-editing.api';
import type { EditableProblem, ProblemBody, ProblemEditingMeta } from '@/api/types/problem-editing';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import { usePermissions } from '@/stores/use-permissions';
import AdminStatus from '../../ui/AdminStatus.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import { failureTextOf } from '../../ui/admin-errors';
import { ADMIN_BUTTON_CLASS, ADMIN_PRIMARY_CLASS } from '../../ui/classes';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { PROBLEM_INDEX_KEY, PUBLIC_PROBLEMS_KEY } from '../problem-editing.queries';
import { EDIT_ALL_PROBLEM } from './field-lock';
import ProblemGeneralForm from './ProblemGeneralForm.vue';
import { checkProblemForm, cloneForm, emptyProblemForm, toProblemBody } from './problem-form';
import type { ProblemForm } from './problem-form';

const props = defineProps<{ meta: ProblemEditingMeta }>();
const router = useRouter();
const { can } = usePermissions();
const defaults = emptyProblemForm(props.meta);
const form = ref<ProblemForm>(cloneForm(defaults));
const localErrors = ref<FieldErrors>({});
const suggestedCode = ref('');

const createMutation = useAdminMutation({
  mutate: (body: ProblemBody) => createProblem(body),
  invalidates: () => [PUBLIC_PROBLEMS_KEY, PROBLEM_INDEX_KEY],
  onDone: (created: EditableProblem) => {
    void router.push({ name: 'admin-problemGeneral', params: { code: created.code } });
  },
});
const errors = computed<FieldErrors>(() => ({
  ...localErrors.value,
  ...createMutation.fieldErrors.value,
  ...suggestMutation.fieldErrors.value,
}));
const suggestMutation = useAdminMutation({
  mutate: (body: ProblemBody) => suggestProblem(body),
  onDone: (suggested: EditableProblem) => {
    suggestedCode.value = suggested.code;
  },
});

/** The body, or null when a local check fails. A staff-only field goes out only for `judge.edit_all_problem`. */
function checkedBody(): ProblemBody | null {
  localErrors.value = checkProblemForm(form.value, can);
  if (Object.keys(localErrors.value).length > 0) return null;
  return toProblemBody(form.value, can(EDIT_ALL_PROBLEM), defaults);
}

async function create() {
  const body = checkedBody();
  if (body && can('judge.add_problem')) await createMutation.run(body);
}

async function suggest() {
  const body = checkedBody();
  if (body) await suggestMutation.run(body);
}

// A message describes the values it was made from: editing a field retires it until the next submit.
watch(
  form,
  () => {
    localErrors.value = {};
    createMutation.fieldErrors.value = {};
    suggestMutation.fieldErrors.value = {};
  },
  { deep: true },
);
</script>

<template>
  <form class="flex flex-col gap-5" novalidate @submit.prevent="create">
    <ProblemGeneralForm v-model="form" :meta="meta" :errors="errors" />
    <SettingsCard
      :title="$t('admin.problems.general.create.block')"
      :lead="$t('admin.problems.general.create.lead')"
    >
      <div class="flex flex-wrap items-center gap-3">
        <button
          v-if="can('judge.add_problem')"
          type="submit"
          :class="ADMIN_PRIMARY_CLASS"
          :aria-disabled="createMutation.isPending.value ? 'true' : undefined"
        >
          {{ $t('admin.problems.general.create.createButton') }}
        </button>
        <button
          v-if="can('judge.suggest_new_problem')"
          type="button"
          :class="ADMIN_BUTTON_CLASS"
          :aria-disabled="suggestMutation.isPending.value ? 'true' : undefined"
          @click="suggest"
        >
          {{ $t('admin.problems.general.create.suggestButton') }}
        </button>
      </div>
      <AdminStatus
        v-if="createMutation.failure.value"
        kind="refused"
        :text="failureTextOf(createMutation.failure.value)"
      />
      <AdminStatus
        v-else-if="suggestMutation.failure.value"
        kind="refused"
        :text="failureTextOf(suggestMutation.failure.value)"
      />
      <AdminStatus
        v-else-if="suggestMutation.isDone.value"
        kind="done"
        :text="$t('admin.problems.general.create.suggested', { code: suggestedCode })"
      />
    </SettingsCard>
  </form>
</template>
