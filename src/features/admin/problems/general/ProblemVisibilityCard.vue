<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { CircleAlert, CircleCheck, Globe, Lightbulb, Lock } from 'lucide-vue-next';
import { updateProblem } from '@/api/problem-editing.api';
import type { EditableProblem } from '@/api/types/problem-editing';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { translate } from '@/i18n';
import { usePermissions } from '@/stores/use-permissions';
import { useViewerId } from '@/stores/use-viewer-id';
import AdminChip from '../../ui/AdminChip.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { needsPermissionText } from '../../ui/permission-text';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { useProblemDataQuery } from '../data/problem-data.queries';
import {
  editableProblemKey,
  PROBLEM_INDEX_KEY,
  PUBLIC_PROBLEMS_KEY,
} from '../problem-editing.queries';
import { setupSteps } from '../setup-steps';
import { EDIT_ALL_PROBLEM } from './field-lock';

/**
 * "Hiện cho thí sinh", the first card of the Basic view: the status, one button that publishes or hides the saved problem
 * on its own (the form's other edits stay unsaved), and while private the setup steps as done/missing chips. Publishing
 * with steps missing asks first (Q-13 B: a warning, never a block — external judging and output-only problems are valid).
 */
const props = defineProps<{ problem: EditableProblem }>();
const { can } = usePermissions();
const queryClient = useQueryClient();
const viewer = useViewerId();
const KEY = 'admin.problems.visibility';

const isPublic = computed(() => props.problem.isPublic);
const audience = computed(() => (props.problem.isOrganizationPrivate ? 'members' : 'everyone'));
/** Who a shown problem is shown to: organization members only, or everyone (the `public` wording). */
const shownTo = computed(() => (audience.value === 'members' ? 'members' : 'public'));
const canChange = computed(
  () => Boolean(props.problem.editor?.canPublishToMembers) || can('judge.change_public_visibility'),
);
const data = useProblemDataQuery(
  () => props.problem.code,
  () => !isPublic.value,
);
/** The setup steps a contestant depends on: everything but the problem info (always done) and publishing itself. */
const checks = computed(() =>
  setupSteps(props.problem, data.data.value?.cases ?? null).filter(
    (step) => step.id !== 'info' && step.id !== 'publish',
  ),
);
const missing = computed(() => checks.value.filter((step) => !step.isDone));
/** Under "missing" only what is missing; once nothing is, the done chips sit under "ready". */
const listedChecks = computed(() => (missing.value.length ? missing.value : checks.value));

const isDialogOpen = ref(false);
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
    isDialogOpen.value = false;
  },
});
function openDialog() {
  mutation.reset();
  isDateNow.value = false;
  isDialogOpen.value = true;
}
</script>

<template>
  <section
    data-testid="problem-visibility"
    :aria-labelledby="`${KEY}-title`"
    :class="[
      'flex flex-col gap-3 rounded-row border bg-surface p-4 sm:p-5',
      isPublic ? 'border-line' : 'border-accent',
    ]"
  >
    <div class="flex flex-wrap items-start gap-3">
      <div class="flex min-w-0 flex-1 basis-64 flex-col gap-1">
        <h2 :id="`${KEY}-title`" class="m-0 text-base font-semibold">
          {{ $t(`${KEY}.title.${audience}`) }}
        </h2>
        <p class="m-0 text-meta text-muted">
          {{ $t(`${KEY}.lead.${isPublic ? shownTo : 'private'}`) }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <AdminChip v-if="isPublic" tone="positive" :icon="Globe">
          {{ $t(`admin.problems.header.${shownTo}`) }}
        </AdminChip>
        <AdminChip v-else-if="problem.editor?.suggester" tone="caution" :icon="Lightbulb">{{
          $t('admin.problems.header.suggested')
        }}</AdminChip>
        <AdminChip v-else :icon="Lock">{{ $t('admin.problems.header.private') }}</AdminChip>
        <AppButton
          v-if="canChange"
          :tone="isPublic ? 'secondary' : 'primary'"
          data-testid="problem-visibility-open"
          @click="openDialog"
        >
          {{ $t(`${KEY}.${isPublic ? 'hide' : 'publish'}.${audience}`) }}
        </AppButton>
      </div>
    </div>
    <p v-if="!canChange" class="m-0 text-meta text-muted">
      {{ needsPermissionText('judge.change_public_visibility') }}
    </p>
    <div v-if="!isPublic && data.data.value" class="flex flex-wrap items-center gap-1.5">
      <span class="text-meta text-muted">{{
        $t(missing.length ? `${KEY}.missing` : `${KEY}.ready`)
      }}</span>
      <AdminChip
        v-for="step in listedChecks"
        :key="step.id"
        :data-step="step.id"
        :tone="step.isDone ? 'positive' : 'caution'"
        :icon="step.isDone ? CircleCheck : CircleAlert"
      >
        {{ $t(`${KEY}.checks.${step.id}.${step.isDone ? 'done' : 'missing'}`) }}
      </AdminChip>
    </div>

    <ConfirmDialog
      v-model:visible="isDialogOpen"
      :title="$t(`${KEY}.${isPublic ? 'hide' : 'publish'}.title`, { code: problem.code })"
      :confirm-label="
        $t(
          isPublic
            ? `${KEY}.hide.confirm`
            : missing.length
              ? `${KEY}.publish.confirmAnyway`
              : `${KEY}.publish.confirm`,
        )
      "
      :busy="mutation.isPending.value"
      @confirm="mutation.run(!isPublic)"
    >
      <template v-if="isPublic">
        <p class="m-0">{{ $t(`${KEY}.hide.body`) }}</p>
      </template>
      <template v-else>
        <p class="m-0">{{ $t(`${KEY}.publish.body.${audience}`) }}</p>
        <div
          v-if="missing.length"
          role="status"
          class="mt-3 rounded-row border border-line bg-warning-bg px-3 py-2 text-sm text-warning"
          data-testid="problem-visibility-warning"
        >
          <p class="m-0 font-semibold">{{ $t(`${KEY}.publish.warning`) }}</p>
          <ul class="m-0 mt-1 list-disc pl-5">
            <li v-for="step in missing" :key="step.id">
              {{ $t(`${KEY}.checks.${step.id}.missing`) }}
            </li>
          </ul>
        </div>
        <label v-if="canSetDate" class="mt-3 flex min-h-11 items-center gap-2 text-sm">
          <input v-model="isDateNow" type="checkbox" class="size-5 accent-accent" />
          {{ $t(`${KEY}.publish.dateNow`) }}
        </label>
      </template>
      <template #error>
        <AdminStatus
          v-if="mutation.failure.value"
          kind="refused"
          :text="failureTextOf(mutation.failure.value)"
        />
      </template>
    </ConfirmDialog>
  </section>
</template>
