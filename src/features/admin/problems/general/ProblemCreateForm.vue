<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  createOrganizationProblem,
  createProblem,
  suggestProblem,
} from '@/api/problem-editing.api';
import type { EditableProblem, ProblemBody, ProblemEditingMeta } from '@/api/types/problem-editing';
import AppButton from '@/components/ui/AppButton.vue';
import FormField from '@/components/ui/FormField.vue';
import Notice from '@/components/ui/Notice.vue';
import TextInput from '@/components/ui/TextInput.vue';
import { usePermissions } from '@/stores/use-permissions';
import CreationOwnerPicker from '../../creation/CreationOwnerPicker.vue';
import OwnerCreditLine from '../../creation/OwnerCreditLine.vue';
import type { CreationOwner } from '../../creation/creation-owners';
import { useCreationScope } from '../../creation/creation-scope';
import type { FieldErrors } from '../../ui/admin-errors';
import { failureTextOf } from '../../ui/admin-errors';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { PROBLEM_INDEX_KEY, PUBLIC_PROBLEMS_KEY } from '../problem-editing.queries';
import { EDIT_ALL_PROBLEM } from './field-lock';
import ProblemCodeField from './ProblemCodeField.vue';
import {
  checkAllowedLanguages,
  checkProblemForm,
  cloneForm,
  newProblemForm,
  PROBLEM_NAME_MAX,
  toProblemBody,
} from './problem-form';
import type { ProblemForm } from './problem-form';

/**
 * The create form: who owns the problem, its code (with the organization prefix) and its name. Limits, points, group and
 * type start from `newProblemForm` and are edited in the editor, which opens on success. The chosen organization's
 * credits show under the owner, and a refusal (the quota, a taken code) shows above the buttons. A viewer who may only
 * suggest gets "Gửi đề xuất bài" instead. `cancellable`: the form sits in a dialog and offers "Hủy".
 */
const props = defineProps<{ meta: ProblemEditingMeta; cancellable?: boolean }>();
const emit = defineEmits<{ cancel: [] }>();
const router = useRouter();
const { can } = usePermissions();
const { scope } = useCreationScope('problem');
const defaults = newProblemForm(props.meta);
const form = ref<ProblemForm>(cloneForm(defaults));
const owner = ref<CreationOwner | null>(null);
const isOwnerReady = ref(false);
const isOwnerBlocked = ref(false);
const localErrors = ref<FieldErrors>({});
const suggestedCode = ref('');

const canCreate = computed(() =>
  owner.value ? scope.value.organizations : can('judge.add_problem'),
);
const canSuggest = computed(() => !owner.value && can('judge.suggest_new_problem'));
/** What the primary button does: create, or suggest for a viewer who may only suggest; nothing while there is no owner to create for. */
const primaryAction = computed(() => {
  if (canCreate.value) return 'create';
  return canSuggest.value ? 'suggest' : 'none';
});

const afterCreate = (created: EditableProblem) => {
  void router.push({ name: 'admin-problemGeneral', params: { code: created.code } });
};
const createMutation = useAdminMutation({
  mutate: (body: ProblemBody) =>
    owner.value ? createOrganizationProblem(owner.value.slug, body) : createProblem(body),
  invalidates: () => [PUBLIC_PROBLEMS_KEY, PROBLEM_INDEX_KEY],
  onDone: afterCreate,
});
const suggestMutation = useAdminMutation({
  mutate: (body: ProblemBody) => suggestProblem(body),
  onDone: (suggested: EditableProblem) => {
    suggestedCode.value = suggested.code;
  },
});
const errors = computed<FieldErrors>(() => ({
  ...localErrors.value,
  ...createMutation.fieldErrors.value,
  ...suggestMutation.fieldErrors.value,
}));
/** The fields on screen; an error on any other one (a default the server refused) is listed above the buttons. */
const SHOWN_FIELDS: readonly string[] = ['code', 'name'];
const otherErrors = computed(() =>
  Object.entries(errors.value)
    .filter(([field]) => !SHOWN_FIELDS.includes(field))
    .map(([, text]) => text),
);
const failure = computed(() => createMutation.failure.value ?? suggestMutation.failure.value);
/** The refusal as a sentence, unless a field on screen already says it. */
const refusalText = computed(() => {
  if (otherErrors.value.length > 0) return otherErrors.value.join(' ');
  const isSaidByField = SHOWN_FIELDS.some((field) => errors.value[field]);
  return failure.value && !isSaidByField ? failureTextOf(failure.value) : '';
});

/** The body, or null when a local check fails. Organization fields are set by the server, so they are never sent. */
function checkedBody(): ProblemBody | null {
  localErrors.value = {
    ...checkProblemForm(form.value, can, owner.value?.problemCodePrefix ?? ''),
    ...checkAllowedLanguages(form.value, can, defaults),
  };
  if (Object.keys(localErrors.value).length > 0) return null;
  return toProblemBody(form.value, can(EDIT_ALL_PROBLEM), defaults);
}

async function create() {
  if (primaryAction.value === 'suggest') {
    await suggest();
    return;
  }
  const body = checkedBody();
  if (body && canCreate.value && isOwnerReady.value) await createMutation.run(body);
}

async function suggest() {
  const body = checkedBody();
  if (body && canSuggest.value) await suggestMutation.run(body);
}

// A message describes the values it was made from: editing a field retires it until the next submit.
watch(
  [form, owner],
  () => {
    localErrors.value = {};
    createMutation.reset();
    suggestMutation.reset();
  },
  { deep: true },
);
</script>

<template>
  <form class="flex flex-col gap-5" novalidate @submit.prevent="create">
    <div class="flex flex-col gap-2">
      <CreationOwnerPicker
        v-model="owner"
        v-model:ready="isOwnerReady"
        v-model:blocked="isOwnerBlocked"
        kind="problem"
        layout="field"
      />
      <OwnerCreditLine v-if="owner" :owner="owner" />
    </div>
    <ProblemCodeField
      v-model="form.code"
      :prefix="owner?.problemCodePrefix ?? ''"
      :error="errors.code"
    />
    <FormField :label="$t('admin.problems.general.basics.name')" :error="errors.name" required>
      <TextInput v-model="form.name" :maxlength="PROBLEM_NAME_MAX" autocomplete="off" />
    </FormField>
    <Notice v-if="refusalText" tone="danger" data-testid="create-refused">{{ refusalText }}</Notice>
    <Notice v-else-if="suggestMutation.isDone.value" tone="success">{{
      $t('admin.problems.general.create.suggested', { code: suggestedCode })
    }}</Notice>
    <p v-if="isOwnerBlocked" class="text-meta text-muted" data-testid="creation-blocked">
      {{ $t('admin.creation.owner.blocked') }}
    </p>
    <p v-else class="text-meta text-muted">{{ $t('admin.creation.problem.nextNote') }}</p>
    <div class="flex flex-wrap items-center justify-end gap-2">
      <AppButton v-if="cancellable" @click="emit('cancel')">{{ $t('common.cancel') }}</AppButton>
      <AppButton
        v-if="canCreate && canSuggest"
        :loading="suggestMutation.isPending.value"
        @click="suggest"
      >
        {{ $t('admin.problems.general.create.suggestButton') }}
      </AppButton>
      <AppButton
        type="submit"
        tone="primary"
        :loading="createMutation.isPending.value || suggestMutation.isPending.value"
        :disabled="primaryAction === 'none' || (primaryAction === 'create' && !isOwnerReady)"
      >
        {{
          primaryAction === 'suggest'
            ? $t('admin.problems.general.create.suggestButton')
            : $t('create.problem')
        }}
      </AppButton>
    </div>
  </form>
</template>
