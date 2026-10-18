<script setup lang="ts">
import { problemTypeLabel } from '@/features/problems/problem-type-label';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  createOrganizationProblem,
  createProblem,
  suggestProblem,
} from '@/api/problem-editing.api';
import type { EditableProblem, ProblemBody, ProblemEditingMeta } from '@/api/types/problem-editing';
import { usePermissions } from '@/stores/use-permissions';
import CreationOwnerPicker from '../../creation/CreationOwnerPicker.vue';
import type { CreationOwner } from '../../creation/creation-owners';
import { useCreationScope } from '../../creation/creation-scope';
import AdminField from '../../ui/AdminField.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import { failureTextOf } from '../../ui/admin-errors';
import { BUTTON, CARD, INPUT } from '../../ui/controls';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { PROBLEM_INDEX_KEY, PUBLIC_PROBLEMS_KEY } from '../problem-editing.queries';
import { EDIT_ALL_PROBLEM } from './field-lock';
import ProblemCodeField from './ProblemCodeField.vue';
import { checkProblemForm, cloneForm, emptyProblemForm, toProblemBody } from './problem-form';
import type { ProblemForm } from './problem-form';

/**
 * Mock-up 3C, the short create form: owner, code (with the organization prefix), name, limits, points, type, group.
 * Every other setting lives on the editor tabs, where the setup checklist leads next.
 */
const props = defineProps<{ meta: ProblemEditingMeta }>();
const router = useRouter();
const { can } = usePermissions();
const { scope } = useCreationScope('problem');
const defaults = emptyProblemForm(props.meta);
const uncategorized = props.meta.types.find((type) => type.name === 'uncategorized');
const form = ref<ProblemForm>({
  ...cloneForm(defaults),
  typeIds: uncategorized ? [uncategorized.id] : [],
});
const owner = ref<CreationOwner | null>(null);
const isOwnerReady = ref(false);
const isOwnerBlocked = ref(false);
const localErrors = ref<FieldErrors>({});
const suggestedCode = ref('');

const typeId = computed({
  get: () => form.value.typeIds[0] ?? '',
  set: (id: string) => {
    form.value.typeIds = id ? [id] : [];
  },
});
const canCreate = computed(() =>
  owner.value ? scope.value.organizations : can('judge.add_problem'),
);
const canSuggest = computed(() => !owner.value && can('judge.suggest_new_problem'));

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

/** The body, or null when a local check fails. Organization fields are set by the server, so they are never sent. */
function checkedBody(): ProblemBody | null {
  localErrors.value = checkProblemForm(form.value, can);
  if (Object.keys(localErrors.value).length > 0) return null;
  return toProblemBody(form.value, can(EDIT_ALL_PROBLEM), defaults);
}

async function create() {
  const body = checkedBody();
  if (body && canCreate.value && isOwnerReady.value) await createMutation.run(body);
}

async function suggest() {
  const body = checkedBody();
  if (body) await suggestMutation.run(body);
}

// A message describes the values it was made from: editing a field retires it until the next submit.
watch(
  [form, owner],
  () => {
    localErrors.value = {};
    createMutation.fieldErrors.value = {};
    suggestMutation.fieldErrors.value = {};
  },
  { deep: true },
);
</script>

<template>
  <form class="flex max-w-3xl flex-col gap-5" novalidate @submit.prevent="create">
    <section :class="CARD" class="flex flex-col gap-5 p-4 sm:p-5">
      <CreationOwnerPicker
        v-model="owner"
        v-model:ready="isOwnerReady"
        v-model:blocked="isOwnerBlocked"
        kind="problem"
      />
      <div class="grid gap-5 sm:grid-cols-2">
        <ProblemCodeField
          v-model="form.code"
          :prefix="owner?.problemCodePrefix ?? ''"
          :error="errors.code"
        />
        <AdminField
          v-slot="{ id, describedBy }"
          input-id="problem-name"
          :label="$t('admin.problems.general.basics.name')"
          :error="errors.name"
          required
        >
          <input
            :id="id"
            v-model="form.name"
            :class="INPUT"
            :aria-describedby="describedBy"
            :aria-invalid="errors.name ? 'true' : undefined"
          />
        </AdminField>
      </div>
      <div class="grid gap-5 sm:grid-cols-3">
        <AdminField
          v-slot="{ id, describedBy }"
          input-id="problem-timeLimit"
          :label="$t('admin.problems.general.limits.timeLimit')"
          :hint="$t('admin.creation.problem.timeHint')"
          :error="errors.timeLimit"
        >
          <input
            :id="id"
            v-model.number="form.timeLimit"
            type="number"
            step="0.01"
            inputmode="decimal"
            :class="INPUT"
            :aria-describedby="describedBy"
            :aria-invalid="errors.timeLimit ? 'true' : undefined"
          />
        </AdminField>
        <AdminField
          v-slot="{ id, describedBy }"
          input-id="problem-memoryLimit"
          :label="$t('admin.problems.general.limits.memoryLimit')"
          :hint="$t('admin.creation.problem.memoryHint')"
          :error="errors.memoryLimit"
        >
          <input
            :id="id"
            v-model.number="form.memoryLimit"
            type="number"
            step="1"
            inputmode="numeric"
            :class="INPUT"
            :aria-describedby="describedBy"
            :aria-invalid="errors.memoryLimit ? 'true' : undefined"
          />
        </AdminField>
        <AdminField
          v-slot="{ id, describedBy }"
          input-id="problem-points"
          :label="$t('admin.problems.general.limits.points')"
          :hint="$t('admin.creation.problem.pointsHint')"
          :error="errors.points"
        >
          <input
            :id="id"
            v-model.number="form.points"
            type="number"
            step="1"
            inputmode="numeric"
            :class="INPUT"
            :aria-describedby="describedBy"
            :aria-invalid="errors.points ? 'true' : undefined"
          />
        </AdminField>
      </div>
      <div class="grid gap-5 sm:grid-cols-2">
        <AdminField
          v-slot="{ id, describedBy }"
          input-id="problem-type"
          :label="$t('admin.creation.problem.type')"
          :error="errors.typeIds"
          required
        >
          <select
            :id="id"
            v-model="typeId"
            :class="INPUT"
            :aria-describedby="describedBy"
            :aria-invalid="errors.typeIds ? 'true' : undefined"
          >
            <option value="">{{ $t('admin.creation.problem.pickType') }}</option>
            <option v-for="type in meta.types" :key="type.id" :value="type.id">
              {{ problemTypeLabel(type) }}
            </option>
          </select>
        </AdminField>
        <AdminField
          v-slot="{ id, describedBy }"
          input-id="problem-group"
          :label="$t('admin.problems.general.classes.group')"
        >
          <select :id="id" v-model="form.groupId" :class="INPUT" :aria-describedby="describedBy">
            <option v-for="group in meta.groups" :key="group.id" :value="group.id">
              {{ group.fullName }}
            </option>
          </select>
        </AdminField>
      </div>
    </section>
    <div class="flex flex-col gap-3">
      <div class="flex flex-wrap items-center gap-3">
        <button
          v-if="canCreate"
          type="submit"
          :class="BUTTON.primary"
          :aria-disabled="createMutation.isPending.value || !isOwnerReady ? 'true' : undefined"
        >
          {{ $t('admin.problems.general.create.createButton') }}
        </button>
        <p v-if="isOwnerBlocked" class="text-sm text-muted" data-testid="creation-blocked">
          {{ $t('admin.creation.owner.blocked') }}
        </p>
        <button
          v-if="canSuggest"
          type="button"
          :class="BUTTON.secondary"
          :aria-disabled="suggestMutation.isPending.value ? 'true' : undefined"
          @click="suggest"
        >
          {{ $t('admin.problems.general.create.suggestButton') }}
        </button>
      </div>
      <p v-if="!isOwnerBlocked" class="text-sm text-muted">
        {{ $t('admin.creation.problem.nextNote') }}
      </p>
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
    </div>
  </form>
</template>
