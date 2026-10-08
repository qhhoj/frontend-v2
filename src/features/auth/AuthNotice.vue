<script setup lang="ts">
import { CircleCheck, Info, TriangleAlert, X } from 'lucide-vue-next';

withDefaults(defineProps<{ tone?: 'info' | 'success' | 'warning'; dismissible?: boolean }>(), {
  tone: 'info',
  dismissible: false,
});
defineEmits<{ dismiss: [] }>();
const TONES = {
  info: 'bg-accent-soft text-accent-soft-text',
  success: 'bg-verdict-ac-bg text-verdict-ac',
  warning: 'bg-verdict-tle-bg text-verdict-tle',
} as const;
const ICONS = { info: Info, success: CircleCheck, warning: TriangleAlert } as const;
</script>

<template>
  <div
    role="status"
    class="flex items-start gap-2.5 rounded-tile px-3.5 py-3 text-sm leading-normal"
    :class="TONES[tone]"
  >
    <component :is="ICONS[tone]" aria-hidden="true" class="mt-0.5 size-[18px] shrink-0" />
    <p class="flex-1"><slot /></p>
    <button
      v-if="dismissible"
      type="button"
      class="-my-2.5 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-full"
      :aria-label="$t('auth.dismissNotice')"
      @click="$emit('dismiss')"
    >
      <X aria-hidden="true" class="size-[18px]" />
    </button>
  </div>
</template>
