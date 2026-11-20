<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { updateProblem } from '@/api/problem-editing.api';
import type { EditableProblem } from '@/api/types/problem-editing';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import Checkbox from '@/components/ui/Checkbox.vue';
import Notice from '@/components/ui/Notice.vue';
import { translate } from '@/i18n';
import { usePermissions } from '@/stores/use-permissions';
import { useViewerId } from '@/stores/use-viewer-id';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import {
  editableProblemKey,
  PROBLEM_INDEX_KEY,
  PUBLIC_PROBLEMS_KEY,
} from '../problem-editing.queries';
import type { SetupStep } from '../setup-steps';
import { EDIT_ALL_PROBLEM } from './field-lock';

/**
 * The confirm step of publishing or hiding a problem, opened from the workbench plate. It changes the saved problem at once.
 * Publishing with steps still open warns and asks again ("Vẫn công khai"); it never blocks here (the plate decides what
 * blocks). A holder of the edit-all permission may set the publish date to today.
 */
const visible = defineModel<boolean>('visible', { required: true });
const props = defineProps<{ problem: EditableProblem; warnings: readonly SetupStep[] }>();
const { can } = usePermissions();
const queryClient = useQueryClient();
const viewer = useViewerId();
const KEY = 'admin.problems.visibility';

const isPublic = computed(() => props.problem.isPublic);
const audience = computed(() => (props.problem.isOrganizationPrivate ? 'members' : 'everyone'));
const isDateNow = ref(false);
const canSetDate = computed(() => can(EDIT_ALL_PROBLEM));
const mutation = useAdminMutation({
  mutate: (shown: boolean) =>
    updateProblem(props.problem.code, {
      isPublic: shown,
      ...(shown && isDateNow.value ? { date: new Date().toISOString() } : {}),
    }),
  invalidates: () => [PUBLIC_PROBLEMS_KEY, PROBLEM_INDEX_KEY],
  successText: (saved: EditableProblem) =>
    translate(`${KEY}.${saved.isPublic ? 'publishedToast' : 'hiddenToast'}`, { code: saved.code }),
  onSuccess: (saved: EditableProblem) => {
    queryClient.setQueryData(editableProblemKey(saved.code, viewer.value), saved);
    visible.value = false;
  },
});
watch(visible, (shown) => {
  if (!shown) return;
  mutation.reset();
  isDateNow.value = false;
});
const confirmKey = computed(() => {
  if (isPublic.value) return `${KEY}.hide.confirm`;
  return props.warnings.length ? `${KEY}.publish.confirmAnyway` : `${KEY}.publish.confirm`;
});
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    :title="$t(`${KEY}.${isPublic ? 'hide' : 'publish'}.title`, { code: problem.code })"
    :confirm-label="$t(confirmKey)"
    :busy="mutation.isPending.value"
    @confirm="mutation.run(!isPublic)"
  >
    <p v-if="isPublic" class="m-0">{{ $t(`${KEY}.hide.body`) }}</p>
    <div v-else class="flex flex-col gap-3">
      <p class="m-0">{{ $t(`${KEY}.publish.body.${audience}`) }}</p>
      <Notice
        v-if="warnings.length"
        tone="warning"
        compact
        role="status"
        :title="$t(`${KEY}.publish.warning`)"
        data-testid="problem-visibility-warning"
      >
        <ul class="m-0 list-disc pl-5">
          <li v-for="step in warnings" :key="step.id">
            {{ $t(`${KEY}.checks.${step.id}.missing`) }}
          </li>
        </ul>
      </Notice>
      <Checkbox v-if="canSetDate" v-model="isDateNow" :label="$t(`${KEY}.publish.dateNow`)" />
    </div>
    <template #error>
      <AdminStatus
        v-if="mutation.failure.value"
        kind="refused"
        :text="failureTextOf(mutation.failure.value)"
      />
    </template>
  </ConfirmDialog>
</template>
