<script setup lang="ts">
import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import type { ProblemDetail } from '@/api/types/problems';
import SubmitForm from './SubmitForm.vue';
import SubmitSheet from './SubmitSheet.vue';
import SubmitSignInLink from './SubmitSignInLink.vue';
import { useDockHeight } from './use-dock-height';
import type { useSubmitForm } from './use-submit-form';
import {
  FULLSCREEN_TOGGLE_ID,
  useFullscreenEffects,
  useSubmitFullscreenPreference,
} from './use-submit-fullscreen';

const BODY_ID = 'submit-dock-body';
/** The phone gets a bottom sheet, anything wider the pinned dock; both share the form state the page owns. */
const props = defineProps<{
  problem: ProblemDetail;
  form: ReturnType<typeof useSubmitForm>;
  isPhone: boolean;
  isSignedIn: boolean;
  resubmitId: string | null;
}>();
/** Whether the editor shows (dock expanded, sheet open); the rail's submit card can open it too. */
const open = defineModel<boolean>('open', { required: true });
const isCollapsed = computed({
  get: () => !open.value,
  set: (collapsed) => (open.value = !collapsed),
});
const dock = ref<HTMLElement | null>(null);
useDockHeight(dock);

const wantsFullscreen = useSubmitFullscreenPreference();
/** The phone's sheet is full screen only while it is open; the dock, whenever the viewer is signed in. */
const isFullscreen = computed(
  () => wantsFullscreen.value && props.isSignedIn && (!props.isPhone || open.value),
);
const fullscreenPanel = ref<HTMLElement | null>(null);
useFullscreenEffects(isFullscreen, fullscreenPanel);
/** Esc leaves, unless it was meant for an open dropdown inside the panel. */
function onPanelEscape(event: KeyboardEvent) {
  const target = event.target as HTMLElement;
  if (event.defaultPrevented || target.closest('[aria-expanded="true"]')) return;
  wantsFullscreen.value = false;
}
</script>

<template>
  <section
    v-if="isFullscreen"
    ref="fullscreenPanel"
    :aria-label="$t('submit.title')"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    class="fixed inset-0 z-50 flex flex-col bg-surface-solid pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] outline-none"
    @keydown.esc="onPanelEscape"
  >
    <div class="min-h-0 flex-1 px-4 py-3">
      <SubmitForm :problem="problem" :form="form" layout="full">
        <template #actions>
          <button
            type="button"
            :aria-label="$t('submit.exitFullscreen')"
            class="flex size-11 items-center justify-center rounded-pill border border-line bg-surface hover:bg-surface-hover"
            @click="wantsFullscreen = false"
          >
            <Minimize2 class="size-5" aria-hidden="true" />
          </button>
        </template>
      </SubmitForm>
    </div>
  </section>
  <SubmitSheet
    v-else-if="isPhone"
    v-model:open="open"
    :problem="problem"
    :form="form"
    :is-signed-in="isSignedIn"
    :resubmit-id="resubmitId"
    @fullscreen="wantsFullscreen = true"
  />
  <section
    v-else
    ref="dock"
    :aria-label="$t('submit.title')"
    class="fixed inset-x-0 bottom-0 z-30 border-t border-line-accent bg-surface-solid pb-[env(safe-area-inset-bottom)]"
  >
    <div class="mx-auto max-h-[70dvh] max-w-[920px] overflow-x-hidden overflow-y-auto px-4 py-2">
      <SubmitSignInLink v-if="!isSignedIn" />
      <SubmitForm
        v-else
        :id="BODY_ID"
        :problem="problem"
        :form="form"
        layout="dock"
        :collapsed="isCollapsed"
      >
        <template #actions>
          <div class="flex items-center gap-2">
            <button
              :id="FULLSCREEN_TOGGLE_ID"
              type="button"
              :aria-label="$t('submit.fullscreen')"
              class="mr-2 flex size-11 items-center justify-center rounded-pill border border-line bg-surface hover:bg-surface-hover"
              @click="wantsFullscreen = true"
            >
              <Maximize2 class="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              :aria-expanded="!isCollapsed"
              :aria-controls="BODY_ID"
              :aria-label="$t(isCollapsed ? 'submit.expand' : 'submit.collapse')"
              class="flex size-11 items-center justify-center rounded-pill border border-line bg-surface hover:bg-surface-hover"
              @click="isCollapsed = !isCollapsed"
            >
              <ChevronUp v-if="isCollapsed" class="size-5" aria-hidden="true" />
              <ChevronDown v-else class="size-5" aria-hidden="true" />
            </button>
          </div>
        </template>
      </SubmitForm>
    </div>
  </section>
</template>
