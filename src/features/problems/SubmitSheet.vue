<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue';
import VerdictRing from '@/features/submissions/VerdictRing.vue';
import type { ProblemDetail } from '@/api/types/problems';
import SubmitForm from './SubmitForm.vue';
import SubmitSheetHeader from './SubmitSheetHeader.vue';
import SubmitSignInLink from './SubmitSignInLink.vue';
import { useDockHeight } from './use-dock-height';
import type { useSubmitForm } from './use-submit-form';

const SHEET_ID = 'submit-sheet';
/** The bar and the open sheet are one surface in two sizes, on the page column: beside the rail, above the phone's tab bar. */
const SHEET_SURFACE =
  'fixed right-0 bottom-[var(--tab-bar-height,0px)] left-[var(--shell-rail,0px)] z-30 rounded-t-card border-t border-line-accent bg-surface-solid pb-(--shell-inset-bottom)';
const props = defineProps<{
  problem: ProblemDetail;
  form: ReturnType<typeof useSubmitForm>;
  isSignedIn: boolean;
}>();
/** The last result rides on the collapsed bar (P5), so the verdict shows without opening the sheet. */
const result = reactive(props.form.result);
const isSending = computed(() => props.form.submitting.value);
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
    <template v-else>
      <SubmitSheetHeader
        ref="header"
        :is-expanded="false"
        :controls-id="SHEET_ID"
        @toggle="isExpanded = true"
      >
        <template v-if="form.lastSubmissionId.value || form.submitting.value" #result>
          <VerdictRing
            size="sm"
            :progress="result.progress"
            :verdict="result.verdict"
            :share="result.partialShare"
            :is-empty="isSending || result.isEmpty"
          />
          <span
            data-testid="sheet-result"
            class="min-w-0 truncate font-mono text-sm text-secondary tabular-nums"
            >{{ isSending ? $t('submit.submitting') : result.text }}</span
          >
        </template>
      </SubmitSheetHeader>
      <!-- The strip inside the sheet announces the result while it is open; collapsed, the bar does. -->
      <p role="status" class="sr-only">{{ isSending ? '' : result.announcement }}</p>
    </template>
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
    <div class="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-3">
      <SubmitForm :problem="problem" :form="form" layout="sheet" />
    </div>
  </section>
</template>
