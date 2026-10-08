<script setup lang="ts">
import { computed, useId } from 'vue';
import { estimatePasswordStrength } from '@/lib/password-strength';
import type { PasswordOwner } from '@/lib/password-strength';
import AuthField from './AuthField.vue';
import PasswordStrength from './PasswordStrength.vue';

const props = withDefaults(
  defineProps<{ name?: string; label?: string; error?: string; owner?: PasswordOwner }>(),
  { name: 'password', label: undefined, error: undefined, owner: () => ({}) },
);
const model = defineModel<string>({ required: true });
const strengthId = useId();
const score = computed(() => estimatePasswordStrength(model.value, props.owner));
</script>

<template>
  <AuthField
    v-model="model"
    type="password"
    :name="name"
    :label="label ?? $t('auth.password')"
    autocomplete="new-password"
    placeholder="••••••••"
    :error="error"
    :described-by="strengthId"
    required
  >
    <PasswordStrength :id="strengthId" :password="model" :score="score" />
  </AuthField>
</template>
