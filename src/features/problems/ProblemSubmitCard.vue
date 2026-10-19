<script setup lang="ts">
import { Send } from 'lucide-vue-next';
import { nextTick } from 'vue';
import Card from '@/components/ui/Card.vue';
import AppButton from '@/components/ui/AppButton.vue';
import InlineBit from '@/components/InlineBit.vue';
import SubmitSignInLink from './SubmitSignInLink.vue';

/** Where the dock's editor sits once it is open. */
const DOCK_EDITOR = '#submit-dock-body textarea, #submit-dock-body [contenteditable="true"]';

/**
 * P-02 B: the one way into the submit flow beside the statement (a phone uses the sheet's bar instead). No dock shows on
 * load; the button opens it at the bottom of the page with the editor focused. The `context` slot takes what a caller
 * adds about where the submission goes (a contest's name, its points).
 */
defineProps<{ isSignedIn: boolean }>();
/** Whether the dock shows. */
const open = defineModel<boolean>('open', { required: true });

async function openDock() {
  open.value = true;
  await nextTick();
  // The dock is pinned to the bottom of the viewport: focusing its editor is all the scrolling it needs.
  document.querySelector<HTMLElement>(DOCK_EDITOR)?.focus();
}
</script>

<template>
  <Card class="flex flex-col gap-3 rounded-card p-4" data-testid="rail-submit">
    <div class="flex items-center justify-between gap-2">
      <h2 class="section-title">{{ $t('problem.rail.submit.title') }}</h2>
      <InlineBit kind="writing" />
    </div>
    <slot name="context" />
    <SubmitSignInLink v-if="!isSignedIn" />
    <template v-else>
      <AppButton tone="primary" block @click="openDock">
        <template #icon><Send class="size-4" aria-hidden="true" /></template>
        {{ $t('problem.rail.submit.open') }}
      </AppButton>
      <p class="text-meta text-muted">{{ $t('problem.rail.submit.hint') }}</p>
    </template>
  </Card>
</template>
