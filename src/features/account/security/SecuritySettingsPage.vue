<script setup lang="ts">
import { useSessionStore } from '@/stores/session.store';
import SettingsLayout from '../settings/SettingsLayout.vue';
import ApiTokenSection from './ApiTokenSection.vue';
import LogoutEverywhereSection from './LogoutEverywhereSection.vue';
import PasswordSection from './PasswordSection.vue';
import TwoFactorSection from './TwoFactorSection.vue';

const session = useSessionStore();
</script>

<template>
  <SettingsLayout>
    <PasswordSection />
    <TwoFactorSection />
    <ApiTokenSection />
    <LogoutEverywhereSection v-if="!session.impersonatorId" />
  </SettingsLayout>
</template>
