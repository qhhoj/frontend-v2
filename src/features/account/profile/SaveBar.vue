<script setup lang="ts">
import { computed } from 'vue';
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

function requestUndo() {
  if (!idle.value) emit('undo');
}
</script>

<template>
  <div
    class="glass sticky bottom-[calc(env(safe-area-inset-bottom)+12px)] z-10 flex flex-wrap items-center justify-between gap-3 rounded-card px-5 py-4 md:px-7"
  >
    <p class="text-sm text-muted">{{ status }}</p>
    <div class="flex gap-2.5">
      <button
        type="button"
        class="min-h-11 rounded-pill border border-line-strong bg-surface-solid px-5 text-sm font-semibold hover:bg-surface-hover aria-disabled:cursor-not-allowed aria-disabled:text-muted"
        :aria-disabled="idle"
        @click="requestUndo"
      >
        {{ $t('settings.profile.undo') }}
      </button>
      <button
        type="submit"
        class="min-h-11 rounded-pill bg-gradient-accent px-5 text-sm font-bold text-on-accent aria-disabled:cursor-not-allowed aria-disabled:bg-none aria-disabled:bg-surface-hover aria-disabled:text-muted"
        :aria-disabled="idle"
      >
        {{ pending ? $t('settings.profile.saving') : $t('settings.profile.save') }}
      </button>
    </div>
  </div>
</template>
