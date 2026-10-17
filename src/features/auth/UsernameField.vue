<script setup lang="ts">
import { Check, CircleAlert, LoaderCircle } from 'lucide-vue-next';
import { computed, useId } from 'vue';
import { translate } from '@/i18n';
import { usernameProblem } from '@/lib/username';
import AuthField from './AuthField.vue';
import { useUsernameAvailability } from './use-username-availability';

withDefaults(defineProps<{ error?: string }>(), { error: undefined });
const model = defineModel<string>({ required: true });
const PROBLEM_KEYS = {
  format: 'auth.issues.username_invalid_characters',
  length: 'auth.usernameTooLong',
} as const;
/** Same rules as the backend, so a bad name is flagged as typed. */
const problem = computed(() => {
  const found = usernameProblem(model.value);
  return found ? translate(PROBLEM_KEYS[found]) : undefined;
});
/** B11 as drawn on RegisterA: checking, free (green) or taken (red, invalid); never a gate. */
const { status } = useUsernameAvailability(model);
const TONES = {
  idle: undefined,
  checking: undefined,
  available: 'positive',
  taken: 'negative',
} as const;
const LINE = {
  idle: { key: '', icon: null, colour: '' },
  checking: { key: 'auth.usernameChecking', icon: LoaderCircle, colour: 'text-muted' },
  available: { key: 'auth.usernameFree', icon: Check, colour: 'text-positive' },
  taken: { key: 'auth.usernameBusy', icon: CircleAlert, colour: 'text-negative' },
} as const;
const line = computed(() => LINE[status.value]);
const availabilityId = useId();
const hintId = useId();
</script>

<template>
  <AuthField
    v-model="model"
    name="username"
    :label="$t('auth.username')"
    autocomplete="username"
    placeholder="bitcoder"
    :error="problem ?? error"
    :tone="TONES[status]"
    :described-by="line.key ? availabilityId : `${availabilityId} ${hintId}`"
    required
    spellcheck="false"
    autocapitalize="none"
  >
    <template v-if="line.icon" #trailing>
      <component
        :is="line.icon"
        aria-hidden="true"
        class="size-[18px]"
        :class="[line.colour, status === 'checking' && 'motion-safe:animate-spin']"
      />
    </template>
    <!-- One line under the field (P-13), so it is as tall as its neighbour in the two-column form: the format hint
         until there is an answer, then the answer. The live region is always rendered, so only answers are announced. -->
    <div class="grid min-h-5 text-meta">
      <p
        :id="availabilityId"
        aria-live="polite"
        class="col-start-1 row-start-1 flex items-center gap-1.5"
        :class="line.colour"
      >
        <template v-if="line.key">{{ $t(line.key) }}</template>
      </p>
      <p v-if="!line.key" :id="hintId" class="col-start-1 row-start-1 text-muted">
        {{ $t('auth.usernameHint') }}
      </p>
    </div>
  </AuthField>
</template>
