<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { computed, ref, watch } from 'vue';
import { removeSecurityKey } from '@/api/account.api';
import { ApiError } from '@/api/client';
import type { SecurityKey } from '@/api/types/account';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import AuthError from '@/features/auth/AuthError.vue';
import AuthField from '@/features/auth/AuthField.vue';
import { useAuthAction } from '@/features/auth/use-auth-action';
import { useSessionStore } from '@/stores/session.store';
import { SECURITY_KEYS_KEY } from './security.queries';
import { rateLimitWaitText } from './totp-setup';

/** Board SetSecurityD "Xoá khoá bảo mật?": the backend wants the current password. */
const props = defineProps<{ securityKey: SecurityKey | null }>();
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ removed: [key: SecurityKey] }>();
const session = useSessionStore();
const queryClient = useQueryClient();
const password = ref('');
/** A wrapper around the field, so a refused password gets the focus (the dialog's own form is not reachable from here). */
const fieldsElement = ref<HTMLElement | null>(null);
const { pending, fieldErrors, summary, error, run, dismiss, reset } = useAuthAction(fieldsElement, [
  'currentPassword',
]);
const errorText = computed(() => rateLimitWaitText(error.value) ?? summary.value);

watch(visible, (open) => {
  if (!open) return;
  password.value = '';
  reset();
});

/** A key already gone (removed in another tab) answers 404: the list is refreshed so the stale row goes. */
const isAlreadyGone = () => error.value instanceof ApiError && error.value.status === 404;

async function remove() {
  const key = props.securityKey;
  if (!key) return;
  if (!(await run(() => removeSecurityKey(key.id, password.value)))) {
    if (isAlreadyGone()) await refreshKeys();
    return;
  }
  visible.value = false;
  emit('removed', key);
  await refreshKeys();
}

async function refreshKeys() {
  await queryClient.invalidateQueries({ queryKey: SECURITY_KEYS_KEY });
  await session.refresh().catch(() => undefined);
}
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    tone="danger"
    :title="$t('settings.keys.removeTitle')"
    :body="$t('settings.keys.removeBody', { name: securityKey?.name ?? '' })"
    :confirm-label="$t('settings.keys.removeConfirm')"
    :busy="pending"
    :can-confirm="password !== ''"
    @confirm="remove"
  >
    <div ref="fieldsElement">
      <AuthField
        v-model="password"
        type="password"
        name="removeKeyPassword"
        autocomplete="current-password"
        :label="$t('auth.changePassword.currentPassword')"
        :error="fieldErrors.currentPassword"
        @input="dismiss('currentPassword')"
      />
    </div>
    <template #error><AuthError :text="errorText" /></template>
  </ConfirmDialog>
</template>
