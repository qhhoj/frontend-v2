<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { createProblem, suggestProblem } from '@/api/problem-editing.api';
import type { EditableProblem, ProblemBody, ProblemEditingMeta } from '@/api/types/problem-editing';
import { usePermissions } from '@/stores/use-permissions';
import AdminStatus from '../../ui/AdminStatus.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import { failureTextOf } from '../../ui/admin-errors';
import { CARD, buttonClass } from '../../ui/controls';
import AdminSaveBar from '../../ui/form/AdminSaveBar.vue';
import AdminSectionNav from '../../ui/form/AdminSectionNav.vue';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { translate } from '@/i18n';
import { PROBLEM_INDEX_KEY, PUBLIC_PROBLEMS_KEY } from '../problem-editing.queries';
import { EDIT_ALL_PROBLEM } from './field-lock';
import ProblemGeneralForm from './ProblemGeneralForm.vue';
import { checkProblemForm, cloneForm, emptyProblemForm, toProblemBody } from './problem-form';
import type { ProblemForm } from './problem-form';
import { problemSections } from './problem-sections';

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
  successText: (created: EditableProblem) =>
    translate('admin.problems.general.create.createdToast', { code: created.code }),
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

const canCreate = computed(() => can('judge.add_problem'));
const canSuggest = computed(() => can('judge.suggest_new_problem'));
const isPending = computed(() => createMutation.isPending.value || suggestMutation.isPending.value);
const failure = computed(() => createMutation.failure.value ?? suggestMutation.failure.value);
const sections = problemSections(false);

async function create() {
  const body = checkedBody();
  if (body && canCreate.value) await createMutation.run(body);
}

/** The save bar's submit: create with `judge.add_problem`, else suggest. */
function submit() {
  return canCreate.value ? create() : suggest();
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
  <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
    <AdminSectionNav :sections="sections" mode="select" class="max-w-xs xl:hidden" />
    <div class="grid gap-6 xl:grid-cols-[minmax(0,55rem)_15rem] xl:items-start">
      <fieldset :disabled="isPending" :class="[CARD, 'm-0 flex min-w-0 flex-col p-0']">
        <ProblemGeneralForm v-model="form" :meta="meta" :errors="errors" />
      </fieldset>
      <AdminSectionNav :sections="sections" class="hidden xl:flex" />
    </div>
    <AdminStatus v-if="failure" kind="refused" :text="failureTextOf(failure)" />
    <AdminStatus
      v-else-if="suggestMutation.isDone.value"
      kind="done"
      :text="$t('admin.problems.general.create.suggested', { code: suggestedCode })"
    />
    <AdminSaveBar
      data-testid="problem-create-bar"
      :dirty-count="0"
      allow-clean
      :pending="isPending"
      :save-label="
        canCreate
          ? $t('admin.problems.general.create.createButton')
          : $t('admin.problems.general.create.suggestButton')
      "
    >
      <template #status>
        <span class="text-muted">{{ $t('admin.problems.general.create.required') }}</span>
      </template>
      <template #actions>
        <RouterLink :to="{ name: 'admin-problems' }" :class="buttonClass('ghost')">
          {{ $t('admin.problems.general.create.cancel') }}
        </RouterLink>
        <button
          v-if="canCreate && canSuggest"
          type="button"
          :class="buttonClass('secondary')"
          :aria-disabled="isPending || undefined"
          @click="suggest"
        >
          {{ $t('admin.problems.general.create.suggestButton') }}
        </button>
      </template>
    </AdminSaveBar>
  </form>
</template>
