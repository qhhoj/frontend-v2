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
</script>

<template>
  <AuthField
    v-model="model"
    name="username"
    :label="$t('auth.username')"
    autocomplete="username"
    placeholder="thanhngan"
    :hint="$t('auth.usernameHint')"
    :error="problem ?? error"
    :tone="TONES[status]"
    :described-by="availabilityId"
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
    <!-- Always rendered, so the line's height is reserved and the answer never moves the form. -->
    <p
      :id="availabilityId"
      aria-live="polite"
      class="flex min-h-5 items-center gap-1.5 text-meta"
      :class="line.colour"
    >
      <template v-if="line.key">{{ $t(line.key) }}</template>
    </p>
  </AuthField>
</template>
