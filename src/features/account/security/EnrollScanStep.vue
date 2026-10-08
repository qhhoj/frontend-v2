<script setup lang="ts">
import { computed, ref } from 'vue';
import { confirmTotp } from '@/api/account.api';
import { ApiError } from '@/api/client';
import type { TotpEnrollment } from '@/api/types/account';
import CopyButton from '@/components/CopyButton.vue';
import AuthError from '@/features/auth/AuthError.vue';
import OtpInput from '@/features/auth/OtpInput.vue';
import { useAuthAction } from '@/features/auth/use-auth-action';
import { translate } from '@/i18n';
import { OTP_LENGTH } from '@/lib/otp';
import { useSessionStore } from '@/stores/session.store';
import SettingsNotice from '../settings/SettingsNotice.vue';
import { BUTTON } from '../settings/buttons';
import QrCode from './QrCode.vue';
import { groupSecret } from './totp-setup';

/** Step 2: QR on wide screens, an app link on phones, the key for typing, and the first code. A wrong code keeps the secret (the backend restores it). */
const props = defineProps<{ enrollment: TotpEnrollment }>();
const emit = defineEmits<{ confirmed: [codes: string[]]; cancel: [] }>();
const session = useSessionStore();
const code = ref('');
const otp = ref<{ focus: () => void } | null>(null);
const formElement = ref<HTMLFormElement | null>(null);
const { pending, error, summary, run } = useAuthAction(formElement);
const ERROR_ID = 'totp-code-error';
const wrongCode = computed(
  () => error.value instanceof ApiError && error.value.code === 'invalid_code',
);
const errorText = computed(() =>
  wrongCode.value ? translate('settings.totp.wrongCode') : summary.value,
);
const SCAN_STEPS = [0, 1, 2];

async function submit() {
  // `complete` and the form both submit; the second call must not clear the boxes mid-request.
  if (pending.value) return;
  if (code.value.length !== OTP_LENGTH) return otp.value?.focus();
  let codes: string[] = [];
  const confirmed = await run(async () => (codes = (await confirmTotp(code.value)).scratchCodes));
  if (!confirmed) {
    code.value = '';
    return otp.value?.focus();
  }
  // The codes come first: a failed session reload must never cost the viewer their only look at them.
  emit('confirmed', codes);
  await session.refresh().catch(() => undefined);
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <SettingsNotice tone="info">{{ $t('settings.totp.passwordConfirmed') }}</SettingsNotice>
    <div class="flex flex-col gap-5 md:flex-row md:items-start">
      <QrCode
        class="hidden md:block"
        :text="props.enrollment.otpauthUrl"
        :label="$t('settings.totp.qrLabel')"
      />
      <div class="flex min-w-0 flex-1 flex-col gap-4">
        <p class="font-semibold max-md:hidden">{{ $t('settings.totp.scanTitle') }}</p>
        <ol class="m-0 flex list-decimal flex-col gap-1 pl-5 text-sm max-md:hidden">
          <li v-for="index in SCAN_STEPS" :key="index">
            {{ $t(`settings.totp.scanSteps.${index}`) }}
          </li>
        </ol>
        <p class="text-sm md:hidden">{{ $t('settings.totp.phoneLead') }}</p>
        <a :href="props.enrollment.otpauthUrl" :class="[BUTTON.primary, 'md:hidden']">{{
          $t('settings.totp.openAppShort')
        }}</a>
        <div class="flex flex-col gap-1.5">
          <span class="text-sm font-semibold">{{ $t('settings.totp.secretLabel') }}</span>
          <div class="flex flex-wrap items-center gap-2.5">
            <code
              class="rounded-cell border border-line bg-surface-strong px-3.5 py-3 font-mono text-sm font-semibold tracking-wide break-all"
              >{{ groupSecret(props.enrollment.secret) }}</code
            >
            <CopyButton :text="props.enrollment.secret" :label="$t('settings.totp.copySecret')" />
          </div>
        </div>
        <a
          :href="props.enrollment.otpauthUrl"
          class="inline-flex min-h-11 items-center font-semibold text-accent-text max-md:hidden"
          >{{ $t('settings.totp.openApp') }}</a
        >
      </div>
    </div>
    <form ref="formElement" data-step="scan" class="flex flex-col gap-3" @submit.prevent="submit">
      <span aria-hidden="true" class="text-sm font-semibold">{{
        $t('settings.totp.codeLabel')
      }}</span>
      <OtpInput
        ref="otp"
        v-model="code"
        :label="$t('settings.totp.codeLabel')"
        :invalid="wrongCode"
        :described-by="wrongCode ? ERROR_ID : undefined"
        @complete="submit"
      />
      <AuthError :id="ERROR_ID" :text="errorText" />
      <div class="flex flex-wrap gap-2.5">
        <button type="submit" :class="BUTTON.primary" :aria-disabled="pending">
          {{ $t('settings.totp.confirm') }}
        </button>
        <button type="button" :class="BUTTON.secondary" @click="emit('cancel')">
          {{ $t('common.cancel') }}
        </button>
      </div>
    </form>
  </div>
</template>
