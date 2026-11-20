<script setup lang="ts">
import { Maximize2, Minimize2, X } from 'lucide-vue-next';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Card from '@/components/ui/Card.vue';
import IconButton from '@/components/ui/IconButton.vue';
import type { ProblemDetail } from '@/api/types/problems';
import SubmitForm from './SubmitForm.vue';
import SubmitSheet from './SubmitSheet.vue';
import { isFocusEditorShortcut } from './submit-shortcuts';
import { OPEN_BUTTON_ID } from './submit-open';
import type { useSubmitForm } from './use-submit-form';
import {
  FULLSCREEN_TOGGLE_ID,
  useFullscreenEffects,
  useSubmitFullscreenPreference,
} from './use-submit-fullscreen';

const BODY_ID = 'submit-pane-body';
const PANE_EDITOR = `#${BODY_ID} textarea, #${BODY_ID} [contenteditable="true"]`;
/**
 * Where the viewer writes and sends a solution, once they open it (`open`). On a wide page the editor opens in place, a card
 * under the statement: its bar holds the language, the upload and the page's one primary button, the result strip sits on
 * top; closed, it takes no room. Where the page is one column (`usesSheet`: phones, tablets) the bottom sheet, whose bar
 * always shows. Either can go full screen. Exactly one form shows at a time; all share the form state the page owns, so the
 * code and the language are the same wherever the viewer looks.
 */
const props = defineProps<{
  problem: ProblemDetail;
  form: ReturnType<typeof useSubmitForm>;
  usesSheet: boolean;
  isSignedIn: boolean;
}>();
/** Whether the pane or the expanded sheet is open. Closing keeps the form state: the page owns it. */
const open = defineModel<boolean>('open', { required: true });

/** The sheet remembers full screen in this browser for its next opening; the pane would cover the statement when the
 *  viewer opens it, so there it lasts for this visit only. */
const sheetWantsFullscreen = useSubmitFullscreenPreference();
const paneWantsFullscreen = ref(false);
const isFullscreen = computed(
  () =>
    props.isSignedIn &&
    (props.usesSheet ? sheetWantsFullscreen.value && open.value : paneWantsFullscreen.value),
);
function setFullscreen(wanted: boolean) {
  if (props.usesSheet) sheetWantsFullscreen.value = wanted;
  else paneWantsFullscreen.value = wanted;
}
const fullscreenPanel = ref<HTMLElement | null>(null);
useFullscreenEffects(isFullscreen, fullscreenPanel);
/** Esc leaves, unless it was meant for an open dropdown inside the panel. */
function onPanelEscape(event: KeyboardEvent) {
  const target = event.target as HTMLElement;
  if (event.defaultPrevented || target.closest('[aria-expanded="true"]')) return;
  setFullscreen(false);
}

const pane = ref<{ $el: HTMLElement } | null>(null);
/** The editor without a jump of the page; the pane is then brought into view whole (not every engine has the method). */
function focusPaneEditor() {
  document.querySelector<HTMLElement>(PANE_EDITOR)?.focus({ preventScroll: true });
  pane.value?.$el.scrollIntoView?.({ block: 'nearest' });
}
/** The caret goes into the pane's editor when it opens, and back to the button that opened it when it closes. */
watch(open, async (isOpen) => {
  if (props.usesSheet || !props.isSignedIn) return;
  await nextTick();
  if (isOpen) focusPaneEditor();
  else document.getElementById(OPEN_BUTTON_ID)?.focus();
});

/** `s` from anywhere on the page but a field or the editor opens the pane if needed and puts the caret in its editor. */
function onKeydown(event: KeyboardEvent) {
  if (props.usesSheet || !props.isSignedIn || !isFocusEditorShortcut(event)) return;
  event.preventDefault();
  if (!open.value)
    open.value = true; // the watcher above focuses the editor once it is there
  else focusPaneEditor();
}
onMounted(() => window.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
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
            tone="ghost"
            @click="setFullscreen(false)"
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
    @fullscreen="setFullscreen(true)"
  />
  <Card
    v-else-if="open && isSignedIn"
    as="section"
    :aria-label="$t('submit.title')"
    data-testid="submit-pane"
    ref="pane"
    padding="md"
    class="flex min-w-0 scroll-my-20 flex-col"
  >
    <SubmitForm :id="BODY_ID" :problem="problem" :form="form" layout="pane">
      <template #tools>
        <div class="flex items-center gap-1">
          <IconButton
            :label="$t('common.close')"
            tone="ghost"
            data-testid="submit-close"
            @click="open = false"
          >
            <X class="size-5" aria-hidden="true" />
          </IconButton>
          <IconButton
            :id="FULLSCREEN_TOGGLE_ID"
            :label="$t('submit.fullscreen')"
            tone="ghost"
            @click="setFullscreen(true)"
          >
            <Maximize2 class="size-5" aria-hidden="true" />
          </IconButton>
        </div>
      </template>
    </SubmitForm>
  </Card>
</template>
