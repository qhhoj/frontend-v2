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
 * The one way into the submit flow beside the statement (a phone uses the sheet's bar instead). No dock shows on
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
  <Card padding="sm" :title="$t('problem.rail.submit.title')" data-testid="rail-submit">
    <template #actions><InlineBit kind="writing" /></template>
    <div class="flex flex-col gap-3">
      <slot name="context" />
      <SubmitSignInLink v-if="!isSignedIn" />
      <template v-else>
        <AppButton tone="primary" block @click="openDock">
          <template #icon><Send class="size-4" aria-hidden="true" /></template>
          {{ $t('problem.rail.submit.open') }}
        </AppButton>
        <p class="text-meta text-muted">{{ $t('problem.rail.submit.hint') }}</p>
      </template>
    </div>
  </Card>
</template>
