<script setup lang="ts">
import { Check } from 'lucide-vue-next';
import { computed, nextTick, ref, watch } from 'vue';
import type { TotpEnrollment } from '@/api/types/account';
import InlineBit from '@/components/InlineBit.vue';
import { translate } from '@/i18n';
import { useSessionStore } from '@/stores/session.store';
import SettingsCard from '../settings/SettingsCard.vue';
import EnrollPasswordStep from './EnrollPasswordStep.vue';
import EnrollScanStep from './EnrollScanStep.vue';
import ScratchCodesPanel from './ScratchCodesPanel.vue';

type EnrolStep = 'password' | 'scan' | 'codes';
const STEPS: readonly EnrolStep[] = ['password', 'scan', 'codes'];
const emit = defineEmits<{ close: []; done: [] }>();
const session = useSessionStore();
const step = ref<EnrolStep>('password');
const enrollment = ref<TotpEnrollment | null>(null);
const codes = ref<string[]>([]);
const heading = ref<HTMLElement | null>(null);
const stepIndex = computed(() => STEPS.indexOf(step.value));
const stepTitle = computed(() =>
  translate('settings.totp.stepTitle', {
    number: stepIndex.value + 1,
    name: translate(`settings.totp.step.${step.value}`),
  }),
);
const MARKER = {
  done: 'border-positive bg-verdict-ac-bg text-positive',
  current: 'border-line-accent bg-accent-soft text-accent-soft-text',
  later: 'border-line-strong text-muted',
} as const;
const markerOf = (index: number) =>
  MARKER[index < stepIndex.value ? 'done' : index === stepIndex.value ? 'current' : 'later'];
// Each step starts at its heading, so a screen reader hears where it is.
watch(step, () => nextTick(() => heading.value?.focus()), { immediate: true });

function onEnrolled(value: TotpEnrollment) {
  enrollment.value = value;
  step.value = 'scan';
}
function onConfirmed(value: string[]) {
  codes.value = value;
  enrollment.value = null; // the secret is not needed any more
  step.value = 'codes';
}
</script>

<template>
  <SettingsCard :title="$t('settings.totp.wizardTitle')" :lead="$t('settings.totp.wizardLead')">
    <template #header-end><InlineBit kind="security" /></template>
    <ol
      :aria-label="$t('settings.totp.steps')"
      class="m-0 flex list-none flex-wrap items-center gap-2.5 p-0 text-sm"
    >
      <li
        v-for="(name, index) in STEPS"
        :key="name"
        class="flex items-center gap-2 font-semibold"
        :aria-current="name === step ? 'step' : undefined"
      >
        <span
          class="flex size-7 items-center justify-center rounded-full border text-meta font-bold"
          :class="markerOf(index)"
        >
          <Check v-if="index < stepIndex" aria-hidden="true" class="size-4" />
          <template v-else>{{ index + 1 }}</template>
        </span>
        {{ $t(`settings.totp.step.${name}`) }}
      </li>
    </ol>
    <h3
      ref="heading"
      tabindex="-1"
      class="font-display text-lg font-bold focus-visible:outline-none"
    >
      {{ stepTitle }}
    </h3>
    <EnrollPasswordStep v-if="step === 'password'" @enrolled="onEnrolled" @cancel="emit('close')" />
    <EnrollScanStep
      v-else-if="step === 'scan' && enrollment"
      :enrollment="enrollment"
      @confirmed="onConfirmed"
      @cancel="emit('close')"
    />
    <ScratchCodesPanel
      v-else
      :codes="codes"
      :username="session.user?.username ?? ''"
      :notice="$t('settings.totp.enabled')"
      @done="emit('done')"
    />
  </SettingsCard>
</template>
