<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import type { ProblemDetail } from '@/api/types/problems';
import SubmitForm from './SubmitForm.vue';
import SubmitSheetHeader from './SubmitSheetHeader.vue';
import SubmitSignInLink from './SubmitSignInLink.vue';
import { useDockHeight } from './use-dock-height';
import type { useSubmitForm } from './use-submit-form';

const SHEET_ID = 'submit-sheet';
/** The bar and the open sheet are one surface in two sizes. */
const SHEET_SURFACE =
  'fixed inset-x-0 bottom-0 z-30 rounded-t-card border-t border-line-accent bg-surface-solid pb-[env(safe-area-inset-bottom)]';
defineProps<{
  problem: ProblemDetail;
  form: ReturnType<typeof useSubmitForm>;
  isSignedIn: boolean;
}>();
const emit = defineEmits<{ fullscreen: [] }>();
/** Per page load: no storage. The page starts it closed so the statement is what the viewer sees first. */
const isExpanded = defineModel<boolean>('open', { required: true });
/** The bar the page reserves room for; the expanded sheet overlays the statement instead. */
const bar = ref<HTMLElement | null>(null);
const header = ref<{ focusTitle: () => void; focusToggle: () => void } | null>(null);
useDockHeight(bar);

// Focus follows the toggle: into the sheet when it opens, back to the button that opened it when it closes.
watch(isExpanded, async (expanded) => {
  await nextTick();
  if (expanded) header.value?.focusTitle();
  else header.value?.focusToggle();
});
</script>

<template>
  <section
    v-if="!isSignedIn || !isExpanded"
    ref="bar"
    :aria-label="$t('submit.title')"
    :class="SHEET_SURFACE"
  >
    <SubmitSignInLink v-if="!isSignedIn" class="px-4 py-1" />
    <SubmitSheetHeader
      v-else
      ref="header"
      :is-expanded="false"
      :controls-id="SHEET_ID"
      @toggle="isExpanded = true"
    />
  </section>
  <section
    v-else
    :id="SHEET_ID"
    role="dialog"
    aria-modal="false"
    :aria-label="$t('submit.title')"
    :class="[SHEET_SURFACE, 'flex h-[min(640px,85dvh)] flex-col']"
    @keydown.esc="isExpanded = false"
  >
    <SubmitSheetHeader
      ref="header"
      :is-expanded="true"
      :controls-id="SHEET_ID"
      @toggle="isExpanded = false"
      @collapse="isExpanded = false"
      @fullscreen="emit('fullscreen')"
    />
    <!-- Mounted per expand, so a standing alert is announced again on reopening: accepted, a reopen is a new look at the form. -->
    <div class="flex min-h-0 flex-1 flex-col px-4 pb-3">
      <SubmitForm :problem="problem" :form="form" layout="sheet" />
    </div>
  </section>
</template>
