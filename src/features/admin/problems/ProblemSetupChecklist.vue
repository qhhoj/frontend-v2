<script setup lang="ts">
import { computed, ref } from 'vue';
import { Check, ChevronDown } from 'lucide-vue-next';
import type { EditableProblem } from '@/api/types/problem-editing';
import AdminBit from '../shell/AdminBit.vue';
import { readStorage, writeStorage } from '@/lib/storage';
import { buttonClass } from '../ui/controls';
import { useProblemDataQuery } from './data/problem-data.queries';
import { isSetupOpen, nextStep, setupSteps } from './setup-steps';
import type { SetupStep } from './setup-steps';

/**
 * While a problem is private, one compact row: progress dots, the next step with its button ("Tiếp theo: Tải test lên")
 * and a toggle for the full step list (remembered per viewer); shown while `isSetupOpen`.
 */
const props = defineProps<{ problem: EditableProblem }>();
// A public problem shows no checklist, so its test data is not read here.
const data = useProblemDataQuery(
  () => props.problem.code,
  () => !props.problem.isPublic,
);
const steps = computed(() => setupSteps(props.problem, data.data.value?.cases ?? null));
const next = computed(() => nextStep(steps.value));
const doneCount = computed(() => steps.value.filter((step) => step.isDone).length);
const EXPANDED_KEY = 'qhhoj.problem-setup.expanded';
const isExpanded = ref(readStorage(EXPANDED_KEY) === '1');
function toggle() {
  isExpanded.value = !isExpanded.value;
  writeStorage(EXPANDED_KEY, isExpanded.value ? '1' : '0');
}
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
    class="flex flex-col gap-3 rounded-row border border-line bg-surface px-3 py-2"
  >
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <h2 class="mr-auto flex items-center gap-2 font-display sm:mr-0 text-base font-bold">
        <AdminBit placement="composing" />{{ $t('admin.creation.steps.heading') }}
      </h2>
      <span
        role="img"
        :aria-label="$t('admin.creation.steps.progress', { done: doneCount, total: steps.length })"
        class="order-3 flex items-center gap-1.5 sm:order-none"
      >
        <span
          v-for="step in steps"
          :key="step.id"
          aria-hidden="true"
          class="size-2.5 rounded-full border"
          :class="step.isDone ? 'border-positive bg-positive' : 'border-line-strong'"
        />
        <span aria-hidden="true" class="ml-1 text-sm text-muted"
          >{{ doneCount }}/{{ steps.length }}</span
        >
      </span>
      <p
        v-if="next"
        class="order-4 flex min-w-0 basis-full flex-wrap sm:order-none sm:flex-1 sm:basis-auto items-center gap-x-3 gap-y-2"
      >
        <b>{{ `${$t('admin.creation.steps.next')} ${$t(titleKey(next))}` }}</b>
        <RouterLink :to="linkOf(next)" :class="buttonClass('primary', 'sm')">
          {{ $t(`admin.creation.steps.${next.id}.action`) }}
        </RouterLink>
      </p>
      <p
        v-else
        class="order-4 min-w-0 basis-full font-semibold text-positive sm:order-none sm:flex-1 sm:basis-auto"
      >
        {{ $t('admin.creation.steps.ready') }}
      </p>
      <button
        type="button"
        :class="buttonClass('ghost', 'sm')"
        class="order-2 sm:order-none sm:ml-auto"
        :aria-expanded="isExpanded"
        aria-controls="problem-setup-steps"
        @click="toggle"
      >
        {{ $t(isExpanded ? 'admin.creation.steps.hideSteps' : 'admin.creation.steps.showSteps') }}
        <ChevronDown
          class="size-4 transition-transform"
          :class="{ 'rotate-180': isExpanded }"
          aria-hidden="true"
        />
      </button>
    </div>
    <ol v-if="isExpanded" id="problem-setup-steps" class="flex flex-col gap-2 pb-1">
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
          class="flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-caption leading-4 font-bold"
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
            <template v-if="step === next">{{ `${$t('admin.creation.steps.next')} ` }}</template
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
