<script setup lang="ts">
import { computed } from 'vue';
import type { PasswordOwner } from '@/lib/password-strength';
import AuthField from './AuthField.vue';
import NewPasswordField from './NewPasswordField.vue';

/** Two sibling fields (two grid cells on register). Attributes (`@input`) go to the password input; pages block a submit when the two differ. */
defineOptions({ inheritAttrs: false });
withDefaults(
  defineProps<{
    name?: string;
    label?: string;
    confirmLabel?: string;
    error?: string;
    owner?: PasswordOwner;
  }>(),
  {
    name: 'newPassword',
    label: undefined,
    confirmLabel: undefined,
    error: undefined,
    owner: () => ({}),
  },
);
const password = defineModel<string>('password', { required: true });
const confirmation = defineModel<string>('confirmation', { required: true });
const mismatch = computed(() => confirmation.value !== '' && confirmation.value !== password.value);
</script>

<template>
  <NewPasswordField
    v-bind="$attrs"
    v-model="password"
    :name="name"
    :label="label ?? $t('auth.newPassword')"
    :error="error"
    :owner="owner"
  />
  <AuthField
    v-model="confirmation"
    type="password"
    name="confirmPassword"
    :label="confirmLabel ?? $t('auth.confirmPassword')"
    autocomplete="new-password"
    placeholder="••••••••"
    :error="mismatch ? $t('auth.passwordMismatch') : undefined"
    required
  />
</template>
