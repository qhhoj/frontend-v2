<script setup lang="ts">
import { ref } from 'vue';
import { enrollTotp } from '@/api/account.api';
import type { TotpEnrollment } from '@/api/types/account';
import AuthError from '@/features/auth/AuthError.vue';
import AuthField from '@/features/auth/AuthField.vue';
import { useAuthAction } from '@/features/auth/use-auth-action';
import { BUTTON } from '../settings/buttons';

/** Step 1: the backend wants the current password before it issues a secret. */
const emit = defineEmits<{ enrolled: [enrollment: TotpEnrollment]; cancel: [] }>();
const password = ref('');
const formElement = ref<HTMLFormElement | null>(null);
const { pending, fieldErrors, summary, run, dismiss } = useAuthAction(formElement, [
  'currentPassword',
]);

async function submit() {
  let enrollment: TotpEnrollment | null = null;
  const enrolled = await run(async () => (enrollment = await enrollTotp(password.value)));
  if (enrolled && enrollment) emit('enrolled', enrollment);
}
</script>

<template>
  <form ref="formElement" data-step="password" class="flex flex-col gap-4" @submit.prevent="submit">
    <AuthField
      v-model="password"
      type="password"
      name="totpPassword"
      autocomplete="current-password"
      :label="$t('auth.changePassword.currentPassword')"
      :error="fieldErrors.currentPassword"
      required
      @input="dismiss('currentPassword')"
    />
    <AuthError :text="summary" />
    <div class="flex flex-wrap gap-2.5">
      <button type="submit" :class="BUTTON.primary" :aria-disabled="pending">
        {{ $t('settings.totp.continue') }}
      </button>
      <button type="button" :class="BUTTON.secondary" @click="emit('cancel')">
        {{ $t('common.cancel') }}
      </button>
    </div>
  </form>
</template>
