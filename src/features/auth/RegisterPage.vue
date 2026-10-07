<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { register } from '@/api/auth.api';
import { ApiError } from '@/api/client';
import { errorMessageKey } from '@/i18n/error-message';

// Unstyled placeholder: logic only until the register mock-up is approved (plan 8b).
const FIELDS = [
  { name: 'username', labelKey: 'auth.username', type: 'text', autocomplete: 'username' },
  { name: 'email', labelKey: 'auth.email', type: 'email', autocomplete: 'email' },
  { name: 'password', labelKey: 'auth.password', type: 'password', autocomplete: 'new-password' },
] as const;
const form = reactive({ username: '', email: '', password: '' });
const pending = ref(false);
const registered = ref(false);
const error = ref<unknown>(null);
/** Backend field messages (English, from class-validator) shown under their inputs. */
const fieldErrors = computed(() => (error.value instanceof ApiError ? error.value.fields : {}));

async function submit() {
  pending.value = true;
  error.value = null;
  try {
    await register({ ...form });
    registered.value = true;
  } catch (caught) {
    error.value = caught;
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <section class="mx-auto max-w-md px-4 py-12">
    <h1 class="font-display text-3xl font-semibold">{{ $t('pages.register') }}</h1>
    <p class="mt-2 text-muted">{{ $t('placeholder.pending') }}</p>
    <p v-if="registered" role="status" class="mt-6">{{ $t('auth.registered') }}</p>
    <form v-else class="mt-6 flex flex-col gap-4" @submit.prevent="submit">
      <label v-for="field in FIELDS" :key="field.name" class="flex flex-col gap-1">
        {{ $t(field.labelKey) }}
        <input
          v-model="form[field.name]"
          :name="field.name"
          :type="field.type"
          :autocomplete="field.autocomplete"
          required
          :aria-invalid="fieldErrors[field.name] ? 'true' : undefined"
          :aria-describedby="fieldErrors[field.name] ? `register-${field.name}-error` : undefined"
          class="min-h-11 rounded-row border border-line bg-surface-strong px-3"
        />
        <span
          v-if="fieldErrors[field.name]"
          :id="`register-${field.name}-error`"
          class="text-sm text-negative"
        >
          {{ fieldErrors[field.name]!.join(' ') }}
        </span>
      </label>
      <p v-if="error" role="alert" class="text-negative">{{ $t(errorMessageKey(error)) }}</p>
      <button
        type="submit"
        :disabled="pending"
        class="min-h-11 rounded-pill border border-line font-semibold"
      >
        {{ $t('auth.submitRegister') }}
      </button>
    </form>
    <RouterLink
      :to="{ name: 'login' }"
      class="mt-4 inline-block text-sm text-accent-text underline"
      >{{ $t('auth.haveAccount') }}</RouterLink
    >
  </section>
</template>
