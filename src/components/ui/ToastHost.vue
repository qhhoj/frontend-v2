<script setup lang="ts">
import { CircleAlert, CircleCheck, Info, X } from 'lucide-vue-next';
import { translate } from '@/i18n';
import AppButton from './AppButton.vue';
import IconButton from './IconButton.vue';
import { dismissToast, pauseToast, resumeToast, toasts } from './toasts';
import type { Toast } from './toasts';

/**
 * The toast stack: one polite region (a failure is an alert), bottom right, bottom centre on phones.
 * Texts come from the global `translate`: the host outlives the component that mounted it.
 */
const ICONS = { success: CircleCheck, danger: CircleAlert, info: Info } as const;
const ICON_TONES = {
  success: 'text-positive',
  danger: 'text-negative',
  info: 'text-info',
} as const;

function undo(toast: Toast) {
  dismissToast(toast.id);
  toast.undo?.();
}
</script>

<template>
  <div
    data-testid="toasts"
    role="status"
    aria-live="polite"
    :aria-label="translate('common.toast.region')"
    class="pointer-events-none fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-toast flex justify-center sm:inset-x-auto sm:right-6 sm:bottom-6"
  >
    <TransitionGroup
      tag="ol"
      class="m-0 flex w-full max-w-sm list-none flex-col gap-2 p-0"
      enter-from-class="translate-y-2 opacity-0"
      enter-active-class="transition-[transform,opacity] duration-(--qh-duration) ease-standard"
      leave-active-class="transition-opacity duration-(--qh-duration-fast) ease-standard"
      leave-to-class="opacity-0"
    >
      <li
        v-for="toast in toasts"
        :key="toast.id"
        :role="toast.tone === 'danger' ? 'alert' : undefined"
        class="pointer-events-auto flex items-start gap-2.5 rounded-row border border-line-strong bg-surface-solid py-2 pr-2 pl-3 text-sm text-content shadow-float"
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
        />
        <p class="m-0 min-w-0 flex-1 py-1.5">{{ toast.text }}</p>
        <AppButton v-if="toast.undo" tone="ghost" size="sm" @click="undo(toast)">
          {{ toast.undoLabel ?? translate('common.undo') }}
        </AppButton>
        <IconButton
          size="sm"
          :label="translate('common.toast.close')"
          @click="dismissToast(toast.id)"
        >
          <X aria-hidden="true" />
        </IconButton>
      </li>
    </TransitionGroup>
  </div>
</template>

<style>
/*
 * Toasts stand above a save bar that is on screen (a page bar, or a drawer footer) so its buttons stay
 * clickable. An idle page bar is not rendered, so nothing is raised for it.
 */
body:has([data-save-bar='page'], [data-save-bar='footer']) [data-testid='toasts'] {
  bottom: 5.5rem;
}
</style>
