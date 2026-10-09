<script setup lang="ts">
import type { EditableProblem, ProblemEditingMeta } from '@/api/types/problem-editing';
import { usePermissions } from '@/stores/use-permissions';
import AdminStatus from '../../ui/AdminStatus.vue';
import { ADMIN_PRIMARY_CLASS } from '../../ui/classes';
import { failureTextOf } from '../../ui/admin-errors';
import ProblemCloneSection from './ProblemCloneSection.vue';
import ProblemAttachmentsSection from '../files/ProblemAttachmentsSection.vue';
import ProblemGeneralForm from './ProblemGeneralForm.vue';
import { useProblemForm } from './use-problem-form';
import ProblemDangerZone from '../lifecycle/ProblemDangerZone.vue';

const props = defineProps<{ problem: EditableProblem; meta: ProblemEditingMeta }>();
const { form, save, errors, mutation, isDirty } = useProblemForm(
  () => props.problem,
  () => props.meta,
);
const { can } = usePermissions();
</script>

<template>
  <div class="flex flex-col gap-5">
    <form class="flex flex-col gap-5" novalidate @submit.prevent="save">
      <ProblemGeneralForm v-model="form" :meta="meta" :errors="errors" />
      <div
        class="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-line bg-surface-solid py-3"
      >
        <AdminStatus
          v-if="mutation.failure.value"
          kind="refused"
          :text="failureTextOf(mutation.failure.value)"
        />
        <AdminStatus v-else-if="mutation.isDone.value" kind="done" :text="$t('admin.ui.saved')" />
        <button
          type="submit"
          class="ml-auto"
          :class="ADMIN_PRIMARY_CLASS"
          :aria-disabled="!isDirty || mutation.isPending.value ? 'true' : undefined"
        >
          {{ $t('admin.ui.save') }}
        </button>
      </div>
    </form>
    <ProblemAttachmentsSection :problem="problem" />
    <ProblemCloneSection v-if="can('judge.clone_problem')" :code="problem.code" />
    <ProblemDangerZone v-if="can('judge.delete_problem')" :code="problem.code" />
  </div>
</template>
