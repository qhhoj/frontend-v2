<script setup lang="ts">
import SettingsCard from '../settings/SettingsCard.vue';
import SettingsNotice from '../settings/SettingsNotice.vue';
import { BUTTON } from '../settings/buttons';

/**
 * Board SetImpersonation: what the owner could do, each with the reason it is locked. The backend refuses all four while
 * impersonating (403); ending every session of the real user on all their devices is not for a viewer to do (Decision 16).
 */
const LOCKED_ACTIONS = [
  {
    titleKey: 'settings.password.title',
    actionKey: 'settings.password.title',
    reasonKey: 'settings.locked.reason',
  },
  {
    titleKey: 'settings.twoFactor.title',
    actionKey: 'settings.totp.enable',
    reasonKey: 'settings.locked.reason',
  },
  {
    titleKey: 'settings.token.title',
    actionKey: 'settings.token.create',
    reasonKey: 'settings.locked.reason',
  },
  {
    titleKey: 'settings.logoutAll.title',
    actionKey: 'settings.logoutAll.action',
    reasonKey: 'settings.locked.logoutAllReason',
  },
] as const;
</script>

<template>
  <SettingsCard :title="$t('settings.locked.title')" :lead="$t('settings.locked.lead')">
    <SettingsNotice tone="warning" bit="security">{{
      $t('settings.locked.notice')
    }}</SettingsNotice>
    <ul class="m-0 flex list-none flex-col p-0">
      <li
        v-for="action in LOCKED_ACTIONS"
        :key="action.titleKey"
        data-locked-action
        class="flex flex-wrap items-center gap-3.5 border-t border-line py-3.5 first:border-t-0"
      >
        <span class="flex min-w-0 flex-1 flex-col gap-0.5">
          <strong class="font-semibold">{{ $t(action.titleKey) }}</strong>
          <span class="text-meta text-muted">{{ $t(action.reasonKey) }}</span>
        </span>
        <button type="button" :class="BUTTON.secondary" disabled>{{ $t(action.actionKey) }}</button>
      </li>
    </ul>
  </SettingsCard>
</template>
