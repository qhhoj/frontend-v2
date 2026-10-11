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
import PolygonLinkPanel from '../polygon/PolygonLinkPanel.vue';
import DraftLeaveDialog from '../drafts/DraftLeaveDialog.vue';
import { useDraftLeaveGuard } from '../drafts/use-draft-leave-guard';
import { ADMIN_INPUT_CLASS } from '../../ui/classes';

const props = defineProps<{ problem: EditableProblem; meta: ProblemEditingMeta }>();
const { form, save, errors, mutation, isDirty, changeMessage } = useProblemForm(
  () => props.problem,
  () => props.meta,
);
const { can } = usePermissions();
const { isLeaveOpen, leaveAnyway } = useDraftLeaveGuard(() => isDirty.value);
</script>

<template>
  <div class="flex flex-col gap-5">
    <PolygonLinkPanel v-if="can('judge.import_polygon_package')" :code="problem.code" />
    <form class="flex flex-col gap-5" novalidate @submit.prevent="save">
      <fieldset
        :disabled="mutation.isPending.value"
        class="m-0 flex min-w-0 flex-col gap-5 border-0 p-0"
      >
        <ProblemGeneralForm
          v-model="form"
          :meta="meta"
          :errors="errors"
          :suggester="problem.editor?.suggester ?? null"
          :is-suggestion-pending="!problem.isPublic"
          :private-code="problem.isPublic ? undefined : problem.code"
        />
      </fieldset>
      <div
        class="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-line bg-surface-solid py-3"
      >
        <AdminStatus
          v-if="mutation.failure.value"
          kind="refused"
          :text="failureTextOf(mutation.failure.value)"
        />
        <AdminStatus v-else-if="mutation.isDone.value" kind="done" :text="$t('admin.ui.saved')" />
        <label v-if="isDirty" class="flex min-w-60 flex-1 items-center gap-2 text-sm font-semibold">
          <span class="shrink-0">{{ $t('admin.problems.general.changeMessage') }}</span>
          <input
            v-model="changeMessage"
            type="text"
            maxlength="500"
            :placeholder="$t('admin.problems.general.changeMessagePlaceholder')"
            :class="[ADMIN_INPUT_CLASS, 'font-normal']"
          />
        </label>
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
    <DraftLeaveDialog v-model:visible="isLeaveOpen" @leave="leaveAnyway" />
  </div>
</template>
