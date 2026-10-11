<script setup lang="ts">
import { CircleAlert, CircleCheck, Info, X } from 'lucide-vue-next';
import { translate } from '@/i18n';
import { buttonClass, iconButtonClass } from '../controls';
import { adminToasts, dismissToast, pauseToast, resumeToast } from './admin-toasts';
import type { Toast } from './admin-toasts';

/**
 * The toast stack: one polite region (an error item is an alert), bottom right, bottom centre on phones.
 * Texts come from the global `translate`: the host outlives the component that mounted it.
 */
const ICONS = { success: CircleCheck, error: CircleAlert, info: Info } as const;
const ICON_TONES = {
  success: 'text-verdict-ac',
  error: 'text-negative',
  info: 'text-tag-5',
} as const;

function undo(toast: Toast) {
  dismissToast(toast.id);
  toast.undo?.();
}
</script>

<template>
  <div
    data-testid="admin-toasts"
    class="pointer-events-none fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[1200] flex justify-center sm:inset-x-auto sm:right-6 sm:bottom-6"
  >
    <TransitionGroup
      tag="ol"
      role="status"
      aria-live="polite"
      :aria-label="translate('admin.feedback.toast.region')"
      class="m-0 flex w-full max-w-sm list-none flex-col gap-2 p-0"
      enter-from-class="translate-y-2 opacity-0"
      enter-active-class="transition-[transform,opacity] duration-(--qh-duration) ease-standard"
      leave-active-class="transition-opacity duration-(--qh-duration-fast) ease-standard"
      leave-to-class="opacity-0"
    >
      <li
        v-for="toast in adminToasts"
        :key="toast.id"
        :role="toast.tone === 'error' ? 'alert' : undefined"
        class="pointer-events-auto flex items-start gap-2.5 rounded-row border border-line-strong bg-surface-solid py-2 pr-2 pl-3 text-sm text-content"
        @mouseenter="pauseToast(toast.id)"
        @mouseleave="resumeToast(toast.id)"
        @focusin="pauseToast(toast.id)"
        @focusout="resumeToast(toast.id)"
      >
        <component
          :is="ICONS[toast.tone]"
          aria-hidden="true"
          class="mt-2 size-4 shrink-0"
          :class="ICON_TONES[toast.tone]"
          :stroke-width="1.75"
        />
        <p class="m-0 min-w-0 flex-1 py-1.5">{{ toast.text }}</p>
        <button
          v-if="toast.undo"
          type="button"
          :class="buttonClass('ghost', 'sm')"
          @click="undo(toast)"
        >
          {{ translate('admin.feedback.toast.undo') }}
        </button>
        <button
          type="button"
          :class="iconButtonClass('ghost', 'sm')"
          :aria-label="translate('admin.feedback.toast.close')"
          :title="translate('admin.feedback.toast.close')"
          @click="dismissToast(toast.id)"
        >
          <X aria-hidden="true" class="size-4" :stroke-width="1.75" />
        </button>
      </li>
    </TransitionGroup>
  </div>
</template>
