<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import { regenerateScratchCodes } from '@/api/account.api';
import AuthError from '@/features/auth/AuthError.vue';
import { useAuthAction } from '@/features/auth/use-auth-action';
import { OTP_LENGTH } from '@/lib/otp';
import { useSessionStore } from '@/stores/session.store';
import SettingsCard from '../settings/SettingsCard.vue';
import { BUTTON } from '../settings/buttons';
import ScratchCodesPanel from './ScratchCodesPanel.vue';
import SecondFactorCodeField from './SecondFactorCodeField.vue';
import { SCRATCH_CODES_REMAINING_KEY } from './security.queries';
import { rateLimitWaitText } from './totp-setup';

/**
 * Board SetSecurityC "Tạo lại mã dự phòng": a code, then the new codes shown once; the remaining count is read again.
 * The codes live only in this component: closing the card or leaving the page unmounts them.
 */
const emit = defineEmits<{ close: [] }>();
const session = useSessionStore();
const queryClient = useQueryClient();
const code = ref('');
const codes = ref<string[]>([]);
const formElement = ref<HTMLFormElement | null>(null);
const { pending, error, summary, run } = useAuthAction(formElement);
const errorText = computed(() => rateLimitWaitText(error.value) ?? summary.value);

async function regenerate() {
  if (code.value.length < OTP_LENGTH) return;
  const done = await run(async () => {
    codes.value = (await regenerateScratchCodes(code.value)).scratchCodes;
  });
  if (!done) return;
  code.value = '';
  await queryClient.invalidateQueries({ queryKey: SCRATCH_CODES_REMAINING_KEY });
}
</script>

<template>
  <SettingsCard
    :title="$t('settings.totp.regenerate')"
    :lead="codes.length ? undefined : $t('settings.totp.regenerateLead')"
  >
    <ScratchCodesPanel
      v-if="codes.length"
      :codes="codes"
      :username="session.user?.username ?? ''"
      :notice="$t('settings.totp.regenerated')"
      @done="emit('close')"
    />
    <form
      v-else
      ref="formElement"
      data-step="regenerate"
      class="flex flex-col gap-4"
      @submit.prevent="regenerate"
    >
      <SecondFactorCodeField v-model="code" :label="$t('settings.totp.regenerateCode')" />
      <AuthError :text="errorText" />
      <div class="flex flex-wrap gap-2.5">
        <button
          type="submit"
          :class="BUTTON.primary"
          :aria-disabled="pending || code.length < OTP_LENGTH"
        >
          {{ $t('settings.totp.regenerateSubmit') }}
        </button>
        <button
          type="button"
          :class="BUTTON.secondary"
          :aria-disabled="pending"
          @click="pending || emit('close')"
        >
          {{ $t('common.cancel') }}
        </button>
      </div>
    </form>
  </SettingsCard>
</template>
