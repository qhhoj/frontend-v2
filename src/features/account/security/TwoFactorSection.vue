<script setup lang="ts">
import { computed, ref } from 'vue';
import { useSessionStore } from '@/stores/session.store';
import SettingsCard from '../settings/SettingsCard.vue';
import SettingsNotice from '../settings/SettingsNotice.vue';
import RegenerateCodesCard from './RegenerateCodesCard.vue';
import TotpEnrollWizard from './TotpEnrollWizard.vue';
import TotpRow from './TotpRow.vue';

/**
 * Board SetSecurityA "Xác thực hai bước": one row per factor; a flow that needs room opens below as its own card.
 * Only one card is open at a time, and every row is busy while one is.
 */
type OpenPanel = 'none' | 'enrol' | 'regenerate';
const session = useSessionStore();
const enabled = computed(() =>
  Boolean(session.user?.isTotpEnabled || session.user?.isWebauthnEnabled),
);
const panel = ref<OpenPanel>('none');
const turnedOff = ref(false);

function open(next: OpenPanel) {
  turnedOff.value = false;
  panel.value = next;
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
    <SettingsNotice v-if="turnedOff" tone="success">{{
      $t('settings.totp.disabled')
    }}</SettingsNotice>
    <ul :aria-label="$t('settings.twoFactor.methods')" class="m-0 flex list-none flex-col p-0">
      <TotpRow
        :busy="panel !== 'none'"
        @enable="open('enrol')"
        @regenerate="open('regenerate')"
        @disabled="turnedOff = true"
      />
      <SecurityKeys :busy="panel !== 'none'" @add="open('addKey')" @removed="keyRemoved" />
    </ul>
  </SettingsCard>
  <TotpEnrollWizard v-if="panel === 'enrol'" @close="panel = 'none'" />
  <RegenerateCodesCard v-if="panel === 'regenerate'" @close="panel = 'none'" />
  <AddSecurityKeyForm v-if="panel === 'addKey'" @added="keyAdded" @close="panel = 'none'" />
</template>
