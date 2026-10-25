<script setup lang="ts">
import { Maximize2, Minimize2, X } from 'lucide-vue-next';
import { computed, nextTick, ref } from 'vue';
import IconButton from '@/components/ui/IconButton.vue';
import type { ProblemDetail } from '@/api/types/problems';
import SubmitForm from './SubmitForm.vue';
import SubmitSheet from './SubmitSheet.vue';
import { useDockHeight } from './use-dock-height';
import type { useSubmitForm } from './use-submit-form';
import {
  FULLSCREEN_TOGGLE_ID,
  useFullscreenEffects,
  useSubmitFullscreenPreference,
} from './use-submit-fullscreen';

const BODY_ID = 'submit-dock-body';
const RAIL_SUBMIT_BUTTON = '[data-testid="rail-submit"] button';
/**
 * Where the rail stacks under the statement (`usesSheet`: phones, tablets) a bottom sheet, beside it the pinned dock; both share the form state the page owns. The
 * dock shows only once opened (the rail's "Nộp bài"), and closes away entirely; after a submit it carries the live
 * result strip.
 */
const props = defineProps<{
  problem: ProblemDetail;
  form: ReturnType<typeof useSubmitForm>;
  usesSheet: boolean;
  isSignedIn: boolean;
}>();
/** Whether the editor shows (dock shown, sheet expanded); the rail's submit card opens the dock. */
const open = defineModel<boolean>('open', { required: true });
const dock = ref<HTMLElement | null>(null);
// A closed dock leaves no room behind; the sheet keeps its own.
useDockHeight(dock, () => !props.usesSheet);
/** Focus goes back to the rail's button that opened the dock. */
async function closeDock() {
  open.value = false;
  await nextTick();
  document.querySelector<HTMLElement>(RAIL_SUBMIT_BUTTON)?.focus();
}

const wantsFullscreen = useSubmitFullscreenPreference();
/** Full screen only while the dock or sheet is open: a remembered preference never opens it on load. */
const isFullscreen = computed(() => wantsFullscreen.value && props.isSignedIn && open.value);
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
    class="fixed inset-0 z-overlay flex flex-col bg-surface-solid pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] outline-none"
    @keydown.esc="onPanelEscape"
  >
    <div class="min-h-0 flex-1 px-4 py-3">
      <SubmitForm :problem="problem" :form="form" layout="full">
        <template #actions>
          <IconButton
            :label="$t('submit.exitFullscreen')"
            tone="secondary"
            @click="wantsFullscreen = false"
          >
            <Minimize2 class="size-5" aria-hidden="true" />
          </IconButton>
        </template>
      </SubmitForm>
    </div>
  </section>
  <SubmitSheet
    v-else-if="usesSheet"
    v-model:open="open"
    :problem="problem"
    :form="form"
    :is-signed-in="isSignedIn"
    @fullscreen="wantsFullscreen = true"
  />
  <section
    v-else-if="open && isSignedIn"
    ref="dock"
    :aria-label="$t('submit.title')"
    class="fixed inset-x-0 bottom-0 z-30 border-t border-line-accent bg-surface-solid pb-[env(safe-area-inset-bottom)]"
  >
    <div class="mx-auto max-h-[70dvh] max-w-[920px] overflow-x-hidden overflow-y-auto px-4 py-2">
      <SubmitForm :id="BODY_ID" :problem="problem" :form="form" layout="dock">
        <template #actions>
          <div class="flex items-center gap-2">
            <IconButton
              :id="FULLSCREEN_TOGGLE_ID"
              :label="$t('submit.fullscreen')"
              tone="secondary"
              class="mr-2"
              @click="wantsFullscreen = true"
            >
              <Maximize2 class="size-5" aria-hidden="true" />
            </IconButton>
            <IconButton :label="$t('submit.close')" tone="secondary" @click="closeDock">
              <X class="size-5" aria-hidden="true" />
            </IconButton>
          </div>
        </template>
      </SubmitForm>
    </div>
  </section>
</template>
