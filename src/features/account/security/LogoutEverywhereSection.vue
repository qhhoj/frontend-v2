<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import AuthError from '@/features/auth/AuthError.vue';
import { useAuthAction } from '@/features/auth/use-auth-action';
import { useSessionStore } from '@/stores/session.store';
import SettingsCard from '../settings/SettingsCard.vue';
import { BUTTON } from '../settings/buttons';

/** Never rendered while viewing as another user: the page leaves it out then (Decision 16). */
const session = useSessionStore();
const router = useRouter();
const confirming = ref(false);
const { pending, summary, run, reset } = useAuthAction();

function open() {
  reset();
  confirming.value = true;
}
async function logoutEverywhere() {
  if (!(await run(() => session.logoutEverywhere()))) return;
  confirming.value = false;
  await router.push({ name: 'login' });
}
</script>

<template>
  <SettingsCard :title="$t('settings.logoutAll.title')" :lead="$t('settings.logoutAll.lead')">
    <template #header-end>
      <button type="button" :class="BUTTON.danger" @click="open">
        {{ $t('settings.logoutAll.action') }}
      </button>
    </template>
    <ConfirmDialog
      v-model:visible="confirming"
      tone="danger"
      :title="$t('settings.logoutAll.confirmTitle')"
      :body="$t('settings.logoutAll.confirmBody')"
      :confirm-label="$t('settings.logoutAll.action')"
      :busy="pending"
      @confirm="logoutEverywhere"
    >
      <template #error><AuthError :text="summary" /></template>
    </ConfirmDialog>
  </SettingsCard>
</template>
