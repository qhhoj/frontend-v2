<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { EditableProblem } from '@/api/types/problem-editing';
import AppButton from '@/components/ui/AppButton.vue';
import Lamp from '@/components/ui/Lamp.vue';
import Readout from '@/components/ui/Readout.vue';
import ReadoutCell from '@/components/ui/ReadoutCell.vue';
import { usePermissions } from '@/stores/use-permissions';
import { needsPermissionText } from '../../ui/permission-text';
import ProblemPublishDialog from '../general/ProblemPublishDialog.vue';
import { publishBlockers, publishWarnings, workbenchSteps } from '../setup-steps';
import type { SetupStep, WorkbenchStepId } from '../setup-steps';

/**
 * The workbench's status plate: the one place that says whether students can see the problem and what is still missing.
 * Left: the state in one sentence and the reason. Right: publishing (or hiding), then the next step as the page's primary.
 * Below: the four setup steps; each opens its section. `steps` is null while the test data is not read yet: the marks are
 * then unknown, never "missing". While the page has unsaved changes the save bar holds the primary and these buttons wait.
 */
const props = defineProps<{
  problem: EditableProblem;
  steps: readonly SetupStep[] | null;
  hasUnsaved: boolean;
}>();
const emit = defineEmits<{ open: [step: WorkbenchStepId] }>();
const { t } = useI18n();
const { can } = usePermissions();
const KEY = 'admin.problems.workbench.plate';
const CHECKS = 'admin.problems.visibility.checks';

const isPublic = computed(() => props.problem.isPublic);
const audience = computed(() => (props.problem.isOrganizationPrivate ? 'members' : 'everyone'));
const canChange = computed(
  () => Boolean(props.problem.editor?.canPublishToMembers) || can('judge.change_public_visibility'),
);
const plateSteps = computed(() => (props.steps ? workbenchSteps(props.steps) : null));
const next = computed(() => plateSteps.value?.find((step) => !step.isDone) ?? null);
const blockers = computed(() => (props.steps ? publishBlockers(props.steps) : []));
const warnings = computed(() => (props.steps ? publishWarnings(props.steps) : []));
/** "Chưa có đề bài · Chưa có test": with no test at all, their missing points go without saying. */
const missingText = (ids: readonly string[]) =>
  ids
    .filter((id) => id !== 'scoring' || !ids.includes('tests'))
    .map((id) => t(`${CHECKS}.${id}.missing`))
    .join(' · ');

const sentenceKey = computed(() => {
  if (isPublic.value) return audience.value === 'members' ? 'members' : 'public';
  return props.problem.editor?.suggester ? 'suggested' : 'draft';
});
const note = computed(() => {
  if (isPublic.value) return t(`${KEY}.note.public`);
  if (!plateSteps.value) return t(`${KEY}.note.loading`);
  if (!next.value) return t(`${KEY}.note.ready`);
  if (next.value.id === 'trial') return t(`${KEY}.note.trial`);
  const openCount = plateSteps.value.filter((step) => !step.isDone).length;
  return t(`${KEY}.note.todo`, { count: openCount, missing: missingText(next.value.missing) });
});

/** Why publishing waits, or undefined when it may be asked for. */
const publishBlockedReason = computed(() => {
  if (props.hasUnsaved) return t(`${KEY}.saveFirst`);
  if (isPublic.value) return undefined;
  if (!props.steps) return t(`${KEY}.note.loading`);
  return blockers.value.length
    ? t(`${KEY}.publishBlocked`, { missing: missingText(blockers.value.map((step) => step.id)) })
    : undefined;
});
const nextBlockedReason = computed(() => (props.hasUnsaved ? t(`${KEY}.saveFirst`) : undefined));
/** Publishing is the primary once no step is left; before that the next step is. */
const isPublishPrimary = computed(
  () => !isPublic.value && plateSteps.value !== null && !next.value,
);
const isDialogOpen = ref(false);
</script>

<template>
  <Readout :label="$t(`${KEY}.label`)" class="flex flex-col gap-4" data-testid="problem-plate">
    <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <ReadoutCell :label="$t(`${KEY}.state`)" size="word" class="flex-1 basis-80">
        {{ $t(`${KEY}.sentence.${sentenceKey}`) }}
        <template #below>
          <span class="text-small text-muted">{{ note }}</span>
          <span v-if="!canChange" class="text-small text-muted">{{
            needsPermissionText('judge.change_public_visibility')
          }}</span>
        </template>
      </ReadoutCell>
      <div class="flex flex-wrap items-center gap-2">
        <AppButton
          v-if="canChange"
          :tone="isPublishPrimary ? 'primary' : 'secondary'"
          data-testid="problem-visibility-open"
          :disabled="publishBlockedReason !== undefined"
          :disabled-reason="publishBlockedReason"
          @click="isDialogOpen = true"
        >
          {{ $t(`admin.problems.visibility.${isPublic ? 'hide' : 'publish'}.${audience}`) }}
        </AppButton>
        <AppButton
          v-if="!isPublic && next?.id === 'trial'"
          tone="primary"
          data-testid="problem-next-step"
          :to="{ name: 'problem', params: { code: problem.code } }"
          :disabled="nextBlockedReason !== undefined"
          :disabled-reason="nextBlockedReason"
        >
          {{ $t(`${KEY}.next.trial`) }}
        </AppButton>
        <AppButton
          v-else-if="!isPublic && next"
          tone="primary"
          data-testid="problem-next-step"
          :disabled="nextBlockedReason !== undefined"
          :disabled-reason="nextBlockedReason"
          @click="emit('open', next.id)"
        >
          {{ $t(`${KEY}.next.${next.id}`) }}
        </AppButton>
      </div>
    </div>
    <ol
      class="m-0 grid list-none grid-cols-2 gap-x-4 gap-y-2 border-t border-line p-0 pt-3 lg:grid-cols-4"
    >
      <li v-for="(step, index) in plateSteps ?? []" :key="step.id" :data-step="step.id">
        <AppButton
          tone="plain"
          class="flex min-h-(--qh-row) w-full items-center gap-3 rounded-row px-2 text-left hover:bg-surface-strong"
          @click="emit('open', step.id)"
        >
          <Lamp :tone="step.isDone ? 'ac' : 'none'" still />
          <span class="flex min-w-0 flex-col">
            <span class="text-body font-semibold"
              >{{ index + 1 }} · {{ $t(`${KEY}.steps.${step.id}`) }}</span
            >
            <span class="truncate text-small text-muted">{{
              step.isDone ? $t(`${KEY}.stepDone`) : missingText(step.missing)
            }}</span>
          </span>
        </AppButton>
      </li>
    </ol>
    <ProblemPublishDialog v-model:visible="isDialogOpen" :problem="problem" :warnings="warnings" />
  </Readout>
</template>
