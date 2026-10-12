<script setup lang="ts">
import { ref } from 'vue';
import { regenerateApiToken } from '@/api/account.api';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import CopyButton from '@/components/CopyButton.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AuthError from '@/features/auth/AuthError.vue';
import AuthField from '@/features/auth/AuthField.vue';
import { useAuthAction } from '@/features/auth/use-auth-action';
import SettingsCard from '../settings/SettingsCard.vue';
import SettingsNotice from '../settings/SettingsNotice.vue';

/** The new token lives in this component only: leaving the page drops it for good (board SetSecurityA). */
const token = ref<string | null>(null);
const confirming = ref(false);
const password = ref('');
/** A wrapper around the field, so a refused password gets the focus (the dialog's own form is not reachable from here). */
const fieldsElement = ref<HTMLElement | null>(null);
const { pending, fieldErrors, summary, run, dismiss, reset } = useAuthAction(fieldsElement, [
  'currentPassword',
]);

function open() {
  reset();
  password.value = '';
  confirming.value = true;
}
async function regenerate() {
  const created = await run(async () => {
    token.value = (await regenerateApiToken(password.value)).token;
  });
  if (!created) return;
  password.value = '';
  confirming.value = false;
}
</script>

<template>
  <SettingsCard :title="$t('settings.token.title')" :lead="$t('settings.token.lead')">
    <template #header-end>
      <AppButton @click="open">
        {{ $t('settings.token.create') }}
      </AppButton>
    </template>
    <template v-if="token">
      <SettingsNotice tone="warning">{{ $t('settings.token.copyNow') }}</SettingsNotice>
      <div class="flex flex-wrap items-center gap-3">
        <code
          class="min-w-0 flex-1 rounded-cell border border-line bg-surface-strong px-3.5 py-3 font-mono text-sm font-semibold break-all"
          >{{ token }}</code
        >
        <CopyButton :text="token" :label="$t('settings.token.copy')" />
      </div>
    </template>
    <p class="text-meta leading-normal text-muted">{{ $t('settings.token.risk') }}</p>
    <ConfirmDialog
      v-model:visible="confirming"
      :title="$t('settings.token.confirmTitle')"
      :body="$t('settings.token.confirmBody')"
      :confirm-label="$t('settings.token.create')"
      :busy="pending"
      :can-confirm="password !== ''"
      @confirm="regenerate"
    >
      <div ref="fieldsElement">
        <AuthField
          v-model="password"
          type="password"
          name="tokenPassword"
          autocomplete="current-password"
          :label="$t('auth.changePassword.currentPassword')"
          :error="fieldErrors.currentPassword"
          @input="dismiss('currentPassword')"
        />
      </div>
      <template #error><AuthError :text="summary" /></template>
    </ConfirmDialog>
  </SettingsCard>
</template>
