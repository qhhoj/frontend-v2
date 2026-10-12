<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import type { SecurityKey } from '@/api/types/account';
import AppButton from '@/components/ui/AppButton.vue';
import AuthError from '@/features/auth/AuthError.vue';
import AuthField from '@/features/auth/AuthField.vue';
import { useAuthAction } from '@/features/auth/use-auth-action';
import { useSessionStore } from '@/stores/session.store';
import SettingsCard from '../settings/SettingsCard.vue';
import SettingsNotice from '../settings/SettingsNotice.vue';
import { addSecurityKey } from './security-key';
import { SECURITY_KEYS_KEY } from './security.queries';

/** Board SetSecurityC "Thêm khoá bảo mật": name, password, then the browser's prompt. A cancelled prompt leaves the form as it was. */
const emit = defineEmits<{ added: [key: SecurityKey]; close: [] }>();
const KEY_NAME_MAX_LENGTH = 100; // backend WebauthnRegisterDto.name
const session = useSessionStore();
const queryClient = useQueryClient();
const name = ref('');
const password = ref('');
const formElement = ref<HTMLFormElement | null>(null);
const { pending, fieldErrors, summary, run, dismiss } = useAuthAction(formElement, [
  'name',
  'currentPassword',
]);
const canSubmit = computed(
  () => !pending.value && name.value.trim() !== '' && password.value !== '',
);

async function submit() {
  if (!canSubmit.value) return;
  let added = null as SecurityKey | null;
  const done = await run(async () => {
    added = await addSecurityKey(name.value.trim(), password.value);
  });
  if (!done || !added) return; // a cancelled prompt is not an error: the form stays as it was
  await queryClient.invalidateQueries({ queryKey: SECURITY_KEYS_KEY });
  await session.refresh().catch(() => undefined);
  emit('added', added);
}
</script>

<template>
  <SettingsCard :title="$t('settings.keys.addTitle')" :lead="$t('settings.keys.addLead')">
    <form
      ref="formElement"
      data-step="add-key"
      class="flex flex-col gap-4"
      @submit.prevent="submit"
    >
      <AuthField
        v-model="name"
        name="keyName"
        autocomplete="off"
        :maxlength="KEY_NAME_MAX_LENGTH"
        :label="$t('settings.keys.nameLabel')"
        :hint="$t('settings.keys.nameHint')"
        :error="fieldErrors.name"
        required
        @input="dismiss('name')"
      />
      <AuthField
        v-model="password"
        type="password"
        name="keyPassword"
        autocomplete="current-password"
        :label="$t('auth.changePassword.currentPassword')"
        :error="fieldErrors.currentPassword"
        required
        @input="dismiss('currentPassword')"
      />
      <SettingsNotice v-if="pending" tone="info">{{ $t('settings.keys.waiting') }}</SettingsNotice>
      <AuthError :text="summary" />
      <div class="flex flex-wrap gap-2.5">
        <AppButton type="submit" tone="primary" :disabled="!canSubmit" :loading="pending">
          {{ pending ? $t('settings.keys.registering') : $t('settings.keys.register') }}
        </AppButton>
        <AppButton :disabled="pending" @click="emit('close')">
          {{ $t('common.cancel') }}
        </AppButton>
      </div>
    </form>
  </SettingsCard>
</template>
