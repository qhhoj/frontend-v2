<script setup lang="ts">
import { ref } from 'vue';
import ChangePasswordForm from '@/features/auth/ChangePasswordForm.vue';
import { useSessionStore } from '@/stores/session.store';
import SettingsCard from '../settings/SettingsCard.vue';
import SettingsNotice from '../settings/SettingsNotice.vue';

/** The change is accepted before the reload, so "changed" shows at once; a failed reload swaps it for the retry hint. A finished change remounts the form clean (`formKey`). */
const session = useSessionStore();
const changed = ref(false);
const reloadFailed = ref(false);
const formKey = ref(0);
const reloadSession = () => session.refresh();

function finished() {
  reloadFailed.value = false;
  formKey.value += 1;
}
</script>

<template>
  <SettingsCard :title="$t('settings.password.title')" :lead="$t('settings.password.lead')">
    <SettingsNotice v-if="reloadFailed" tone="success">{{
      $t('auth.changePassword.changedNotLoaded')
    }}</SettingsNotice>
    <SettingsNotice v-else-if="changed" tone="success">{{
      $t('settings.password.changed')
    }}</SettingsNotice>
    <ChangePasswordForm
      :key="formKey"
      :after-change="reloadSession"
      @accepted="changed = true"
      @reload-failed="reloadFailed = true"
      @changed="finished"
    />
  </SettingsCard>
</template>
