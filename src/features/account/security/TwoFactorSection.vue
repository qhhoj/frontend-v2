<script setup lang="ts">
import { computed, ref } from 'vue';
import { useSessionStore } from '@/stores/session.store';
import SettingsCard from '../settings/SettingsCard.vue';
import TotpEnrollWizard from './TotpEnrollWizard.vue';
import TotpRow from './TotpRow.vue';

/** Board SetSecurityA "Xác thực hai bước": one row per factor; the enrolment wizard opens below as its own card. */
const session = useSessionStore();
const enabled = computed(() =>
  Boolean(session.user?.isTotpEnabled || session.user?.isWebauthnEnabled),
);
const enrolling = ref(false);
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
    <ul :aria-label="$t('settings.twoFactor.methods')" class="m-0 flex list-none flex-col p-0">
      <TotpRow :busy="enrolling" @enable="enrolling = true" />
    </ul>
  </SettingsCard>
  <TotpEnrollWizard v-if="enrolling" @close="enrolling = false" />
</template>
