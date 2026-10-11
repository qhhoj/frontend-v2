<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Lock } from 'lucide-vue-next';
import AdminChip from '../ui/AdminChip.vue';
import AdminField from '../ui/AdminField.vue';
import { BUTTON, INPUT } from '../ui/controls';
import type { SecretDraft } from './setting-values';

/** A sealed value: only "set" or "not set" is ever shown. Typing is a replacement, and an empty box keeps the stored value. */
defineProps<{ label: string; hint: string }>();
const part = defineModel<SecretDraft>({ required: true });
const { t } = useI18n();

const typed = computed({
  get: () => part.value.replacement,
  set: (replacement: string) => (part.value = { ...part.value, replacement }),
});
const typedInput = ref<HTMLInputElement | null>(null);
/** Opening the box moves focus into it, so a keyboard user types the new value straight away. */
const startReplacing = async () => {
  part.value = { ...part.value, isReplacing: true };
  await nextTick();
  typedInput.value?.focus();
};
const cancelReplacing = () => (part.value = { ...part.value, isReplacing: false, replacement: '' });
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-wrap items-center gap-2">
      <span class="text-sm font-semibold">{{ label }}</span>
      <AdminChip :tone="part.isSet ? 'accent' : 'neutral'" :icon="Lock">
        {{ part.isSet ? t('admin.settings.chip.set') : t('admin.settings.chip.unset') }}
      </AdminChip>
      <button
        v-if="!part.isReplacing"
        type="button"
        :class="BUTTON.secondary"
        @click="startReplacing"
      >
        {{ part.isSet ? t('admin.settings.secret.replace') : t('admin.settings.secret.set') }}
      </button>
      <button v-else type="button" :class="BUTTON.secondary" @click="cancelReplacing">
        {{ t('admin.settings.secret.cancelReplace') }}
      </button>
      <slot name="actions" />
    </div>
    <p v-if="part.isSet && !part.isReplacing" class="font-mono text-sm text-muted">
      {{ t('admin.settings.secret.masked') }}
    </p>
    <AdminField
      v-if="part.isReplacing"
      v-slot="{ id, describedBy }"
      :label="label"
      :hint="`${t('admin.settings.secret.neverShown')} ${t('admin.settings.secret.emptyKeeps')}`"
    >
      <input
        :id="id"
        ref="typedInput"
        v-model="typed"
        type="password"
        autocomplete="new-password"
        :aria-describedby="describedBy"
        :class="INPUT"
      />
    </AdminField>
    <p v-else class="text-xs text-muted">{{ hint }}</p>
  </div>
</template>
