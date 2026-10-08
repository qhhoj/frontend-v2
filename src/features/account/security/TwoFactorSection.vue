<script setup lang="ts">
import { computed, ref } from 'vue';
import type { SecurityKey } from '@/api/types/account';
import { translate } from '@/i18n';
import { useSessionStore } from '@/stores/session.store';
import SettingsCard from '../settings/SettingsCard.vue';
import SettingsNotice from '../settings/SettingsNotice.vue';
import AddSecurityKeyForm from './AddSecurityKeyForm.vue';
import RegenerateCodesCard from './RegenerateCodesCard.vue';
import SecurityKeys from './SecurityKeys.vue';
import TotpEnrollWizard from './TotpEnrollWizard.vue';
import TotpRow from './TotpRow.vue';

/**
 * Board SetSecurityA "Xác thực hai bước": one row per factor; a flow that needs room opens below as its own card.
 * Only one card is open at a time, and every row is busy while one is.
 */
type OpenPanel = 'none' | 'enrol' | 'regenerate' | 'addKey';
const session = useSessionStore();
const enabled = computed(() =>
  Boolean(session.user?.isTotpEnabled || session.user?.isWebauthnEnabled),
);
const panel = ref<OpenPanel>('none');
/** One success notice at a time: the last finished action says what happened. */
const notice = ref<string | null>(null);

function open(next: OpenPanel) {
  notice.value = null;
  panel.value = next;
}
function keyAdded(key: SecurityKey) {
  panel.value = 'none';
  notice.value = translate('settings.keys.added', { name: key.name });
}
function keyRemoved(key: SecurityKey) {
  notice.value = translate('settings.keys.removed', { name: key.name });
}
function totpDisabled() {
  notice.value = translate('settings.totp.disabled');
}
</script>

<template>
  <SettingsCard :title="$t('settings.twoFactor.title')" :lead="$t('settings.twoFactor.lead')">
    <template #header-end>
      <span
        class="rounded-pill px-2.5 py-0.5 text-xs font-semibold"
        :class="
          enabled
            ? 'bg-verdict-ac-bg text-verdict-ac'
            : 'bg-verdict-pending-bg text-verdict-pending'
        "
        >{{ enabled ? $t('settings.twoFactor.on') : $t('settings.twoFactor.off') }}</span
      >
    </template>
    <SettingsNotice v-if="notice" tone="success">{{ notice }}</SettingsNotice>
    <ul :aria-label="$t('settings.twoFactor.methods')" class="m-0 flex list-none flex-col p-0">
      <TotpRow
        :busy="panel !== 'none'"
        @enable="open('enrol')"
        @regenerate="open('regenerate')"
        @disabled="totpDisabled"
      />
      <SecurityKeys :busy="panel !== 'none'" @add="open('addKey')" @removed="keyRemoved" />
    </ul>
  </SettingsCard>
  <TotpEnrollWizard v-if="panel === 'enrol'" @close="panel = 'none'" />
  <RegenerateCodesCard v-if="panel === 'regenerate'" @close="panel = 'none'" />
  <AddSecurityKeyForm v-if="panel === 'addKey'" @added="keyAdded" @close="panel = 'none'" />
</template>
