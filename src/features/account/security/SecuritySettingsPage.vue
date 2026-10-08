<script setup lang="ts">
import { useSessionStore } from '@/stores/session.store';
import SettingsLayout from '../settings/SettingsLayout.vue';
import ApiTokenSection from './ApiTokenSection.vue';
import LockedSecurity from './LockedSecurity.vue';
import LogoutEverywhereSection from './LogoutEverywhereSection.vue';
import PasswordSection from './PasswordSection.vue';
import TwoFactorSection from './TwoFactorSection.vue';

const session = useSessionStore();
</script>

<template>
  <SettingsLayout>
    <LockedSecurity v-if="session.impersonatorId" />
    <template v-else>
      <PasswordSection />
      <TwoFactorSection />
      <ApiTokenSection />
      <LogoutEverywhereSection />
    </template>
  </SettingsLayout>
</template>
