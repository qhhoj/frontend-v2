<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { ref, watch } from 'vue';
import { disableTotp } from '@/api/account.api';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import AuthError from '@/features/auth/AuthError.vue';
import { useAuthAction } from '@/features/auth/use-auth-action';
import { OTP_LENGTH } from '@/lib/otp';
import { useSessionStore } from '@/stores/session.store';
import SecondFactorCodeField from './SecondFactorCodeField.vue';
import { SCRATCH_CODES_REMAINING_KEY } from './security.queries';

/** Board SetSecurityD "Tắt xác thực hai bước?": a code (or backup code) proves the viewer holds the factor. */
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ disabled: [] }>();
const session = useSessionStore();
const queryClient = useQueryClient();
const code = ref('');
const { pending, summary, run, reset } = useAuthAction();

watch(visible, (open) => {
  if (!open) return;
  code.value = '';
  reset();
});

async function turnOff() {
  if (!(await run(() => disableTotp(code.value)))) return;
  visible.value = false;
  emit('disabled');
  await session.refresh().catch(() => undefined);
  // The count belonged to the codes that are now deleted; a later re-enable must not show it.
  queryClient.removeQueries({ queryKey: SCRATCH_CODES_REMAINING_KEY });
}
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    tone="danger"
    :title="$t('settings.totp.disableTitle')"
    :body="$t('settings.totp.disableBody')"
    :confirm-label="$t('settings.totp.disableConfirm')"
    :busy="pending"
    :can-confirm="code.length >= OTP_LENGTH"
    @confirm="turnOff"
  >
    <SecondFactorCodeField v-model="code" :label="$t('settings.totp.disableCode')" />
    <template #error><AuthError :text="summary" /></template>
  </ConfirmDialog>
</template>
