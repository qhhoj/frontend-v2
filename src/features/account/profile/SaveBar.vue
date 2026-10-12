<script setup lang="ts">
import { computed } from 'vue';
import AppButton from '@/components/ui/AppButton.vue';
import { translate } from '@/i18n';

/** Sticky at the bottom of the form (board SetProfile, SetPhone); Save is the form's submit button. */
const props = defineProps<{ dirty: boolean; pending: boolean; invalidCount: number }>();
const emit = defineEmits<{ undo: [] }>();
/** Undo and Save do nothing while there is nothing to save or a save is running; they stay in place, greyed. */
const idle = computed(() => !props.dirty || props.pending);
const status = computed(() => {
  if (props.invalidCount)
    return translate('settings.profile.fixToSave', { count: props.invalidCount });
  return translate(props.dirty ? 'settings.profile.unsaved' : 'settings.profile.noChanges');
});
</script>

<template>
  <div
    class="glass sticky bottom-[calc(env(safe-area-inset-bottom)+12px)] z-10 flex flex-wrap items-center justify-between gap-3 rounded-card px-5 py-4 md:px-7"
  >
    <p class="text-sm text-muted">{{ status }}</p>
    <div class="flex gap-2.5">
      <AppButton :disabled="idle" @click="emit('undo')">
        {{ $t('settings.profile.undo') }}
      </AppButton>
      <AppButton type="submit" tone="primary" :disabled="!dirty" :loading="pending">
        {{ pending ? $t('settings.profile.saving') : $t('settings.profile.save') }}
      </AppButton>
    </div>
  </div>
</template>
