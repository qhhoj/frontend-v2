<script setup lang="ts">
import { useSessionStore } from '@/stores/session.store';
import SettingsLayout from '../settings/SettingsLayout.vue';
import ApiTokenSection from './ApiTokenSection.vue';
import LogoutEverywhereSection from './LogoutEverywhereSection.vue';
import PasswordSection from './PasswordSection.vue';

const session = useSessionStore();
</script>

<template>
  <SettingsLayout>
    <PasswordSection />
    <ApiTokenSection />
    <LogoutEverywhereSection v-if="!session.impersonatorId" />
  </SettingsLayout>
</template>
