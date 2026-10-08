<script setup lang="ts">
import { ref } from 'vue';
import { regenerateApiToken } from '@/api/account.api';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import CopyButton from '@/components/CopyButton.vue';
import AuthError from '@/features/auth/AuthError.vue';
import { useAuthAction } from '@/features/auth/use-auth-action';
import SettingsCard from '../settings/SettingsCard.vue';
import SettingsNotice from '../settings/SettingsNotice.vue';
import { BUTTON } from '../settings/buttons';

/** The new token lives in this component only: leaving the page drops it for good (board SetSecurityA). */
const token = ref<string | null>(null);
const confirming = ref(false);
const { pending, summary, run, reset } = useAuthAction();

function open() {
  reset();
  confirming.value = true;
}
async function regenerate() {
  const created = await run(async () => {
    token.value = (await regenerateApiToken()).token;
  });
  if (created) confirming.value = false;
}
</script>

<template>
  <SettingsCard :title="$t('settings.token.title')" :lead="$t('settings.token.lead')">
    <template #header-end>
      <button type="button" :class="BUTTON.secondary" @click="open">
        {{ $t('settings.token.create') }}
      </button>
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
    <p class="text-[13px] leading-normal text-muted">{{ $t('settings.token.risk') }}</p>
    <ConfirmDialog
      v-model:visible="confirming"
      :title="$t('settings.token.confirmTitle')"
      :body="$t('settings.token.confirmBody')"
      :confirm-label="$t('settings.token.create')"
      :busy="pending"
      @confirm="regenerate"
    >
      <template #error><AuthError :text="summary" /></template>
    </ConfirmDialog>
  </SettingsCard>
</template>
