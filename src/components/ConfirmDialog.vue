<script setup lang="ts">
import Dialog from 'primevue/dialog';

/** One confirm step for every destructive or irreversible choice. Its look comes from the shared Dialog preset. */
defineProps<{
  title: string;
  body: string;
  confirmLabel: string;
  tone?: 'neutral' | 'danger';
  busy?: boolean;
}>();
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ confirm: [] }>();
</script>

<template>
  <Dialog v-model:visible="visible" modal :header="title" :draggable="false">
    <p class="text-muted">{{ body }}</p>
    <template #footer>
      <button
        type="button"
        class="min-h-11 rounded-pill border border-line px-5 font-semibold hover:bg-surface-hover"
        @click="visible = false"
      >
        {{ $t('common.cancel') }}
      </button>
      <button
        type="button"
        :aria-disabled="busy || undefined"
        :class="
          tone === 'danger'
            ? 'min-h-11 rounded-pill border border-negative px-5 font-semibold text-negative'
            : 'min-h-11 rounded-pill bg-gradient-accent px-5 font-semibold text-on-accent'
        "
        @click="!busy && emit('confirm')"
      >
        {{ confirmLabel }}
      </button>
    </template>
  </Dialog>
</template>
