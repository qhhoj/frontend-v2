<script setup lang="ts">
import { computed } from 'vue';
import { Check } from 'lucide-vue-next';
import type { EditableProblem } from '@/api/types/problem-editing';
import AdminBit from '../shell/AdminBit.vue';
import { buttonClass } from '../ui/controls';
import { useProblemDataQuery } from './data/problem-data.queries';
import { isSetupOpen, nextStep, setupSteps } from './setup-steps';
import type { SetupStep } from './setup-steps';

/**
 * Mock-up 3C: while a problem is private, the manual setup steps in order, the next one highlighted with its button
 * ("Tiếp theo: tải test lên"); shown while `isSetupOpen`.
 */
const props = defineProps<{ problem: EditableProblem }>();
// A public problem shows no checklist, so its test data is not read here.
const data = useProblemDataQuery(
  () => props.problem.code,
  () => !props.problem.isPublic,
);
const steps = computed(() => setupSteps(props.problem, data.data.value?.cases ?? null));
const next = computed(() => nextStep(steps.value));
const isOpen = computed(() => isSetupOpen(props.problem, steps.value));
const audience = computed(() => (props.problem.isOrganizationPrivate ? 'members' : 'everyone'));
const titleKey = (step: SetupStep) =>
  step.id === 'publish'
    ? `admin.creation.steps.publish.${audience.value}`
    : `admin.creation.steps.${step.id}.title`;
const linkOf = (step: SetupStep) => ({
  name: step.routeName,
  params: { code: props.problem.code },
});
</script>

<template>
  <section
    v-if="isOpen"
    data-testid="problem-setup"
    :aria-label="$t('admin.creation.steps.label')"
    class="flex flex-col gap-3 rounded-row border border-line bg-surface p-4"
  >
    <h2 class="flex items-center gap-2 font-display text-base font-bold">
      <AdminBit placement="composing" />{{ $t('admin.creation.steps.heading') }}
    </h2>
    <ol class="flex flex-col gap-2">
      <li
        v-for="(step, index) in steps"
        :key="step.id"
        :data-step="step.id"
        :aria-current="step === next ? 'step' : undefined"
        class="flex flex-wrap items-center gap-3 rounded-row border px-3 py-2.5"
        :class="step === next ? 'border-2 border-accent bg-accent-soft' : 'border-line'"
      >
        <span
          aria-hidden="true"
          class="flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold"
          :class="
            step.isDone
              ? 'border-positive bg-positive text-on-accent'
              : 'border-line-strong text-muted'
          "
        >
          <Check v-if="step.isDone" class="size-3.5" :stroke-width="3" />
          <template v-else>{{ index + 1 }}</template>
        </span>
        <span class="flex min-w-0 flex-1 flex-col">
          <b>
            <template v-if="step === next">{{ $t('admin.creation.steps.next') }} </template
            >{{ $t(titleKey(step)) }}
          </b>
          <span class="text-sm text-muted">{{ $t(`admin.creation.steps.${step.id}.hint`) }}</span>
          <span class="sr-only">{{
            step.isDone ? $t('admin.creation.steps.done') : $t('admin.creation.steps.todo')
          }}</span>
        </span>
        <RouterLink
          v-if="step === next"
          :to="linkOf(step)"
          :class="buttonClass('primary')"
          class="w-full sm:w-auto"
        >
          {{ $t(`admin.creation.steps.${step.id}.action`) }}
        </RouterLink>
      </li>
    </ol>
  </section>
</template>
