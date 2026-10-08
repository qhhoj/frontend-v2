<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import AuthField from '@/features/auth/AuthField.vue';
import OtpInput from '@/features/auth/OtpInput.vue';
import { normalizeBackupCode } from '@/lib/otp';

/** The app's six digits, or a backup code typed as printed (`K7QM-2XRA-…`): the model is always what the backend accepts. */
withDefaults(defineProps<{ label: string; error?: string }>(), { error: undefined });
const code = defineModel<string>({ required: true });
const backupMode = ref(false);
const backupText = ref('');
const root = ref<HTMLElement | null>(null);
/** Dashes from other keyboards and zero-width characters from copied text, removed before the code is normalised. */
const UNPRINTED_OR_DASH = /[\u2010-\u2015\u2212\u200B\uFEFF]/g;
watch(
  backupText,
  (text) => (code.value = normalizeBackupCode(text.replace(UNPRINTED_OR_DASH, ''))),
);

/** The newly shown input takes focus: a keyboard or screen-reader user lands in the field that changed. */
async function switchMode() {
  backupMode.value = !backupMode.value;
  backupText.value = '';
  code.value = '';
  await nextTick();
  root.value?.querySelector<HTMLInputElement>('input')?.focus();
}
</script>

<template>
  <div ref="root" class="flex flex-col gap-2">
    <template v-if="!backupMode">
      <span aria-hidden="true" class="text-sm font-semibold">{{ label }}</span>
      <OtpInput v-model="code" :label="label" />
      <p v-if="error" class="text-[13px] text-negative">{{ error }}</p>
    </template>
    <AuthField
      v-else
      v-model="backupText"
      name="backupCode"
      autocomplete="one-time-code"
      spellcheck="false"
      :label="$t('settings.secondFactor.backupLabel')"
      :error="error"
    />
    <button
      type="button"
      class="inline-flex min-h-11 items-center self-start text-sm font-semibold text-accent-text"
      @click="switchMode"
    >
      {{ backupMode ? $t('settings.secondFactor.useApp') : $t('settings.secondFactor.useBackup') }}
    </button>
  </div>
</template>
