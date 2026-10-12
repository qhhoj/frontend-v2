<script setup lang="ts">
import { nextTick, reactive } from 'vue';
import type { ProblemDetail } from '@/api/types/problems';
import GlassCard from '@/components/GlassCard.vue';
import InlineBit from '@/components/InlineBit.vue';
import LanguagePicker from './LanguagePicker.vue';
import SubmitSignInLink from './SubmitSignInLink.vue';
import type { useSubmitForm } from './use-submit-form';

/** Where the dock's editor sits once the desktop dock is open; the phone sheet takes its own focus. */
const DOCK_EDITOR = '#submit-dock-body textarea, #submit-dock-body [contenteditable="true"]';

/** The rail's way into the submit flow: it shares the form state with the dock (desktop) or sheet (phone) and opens it. */
const props = defineProps<{
  problem: ProblemDetail;
  form: ReturnType<typeof useSubmitForm>;
  isSignedIn: boolean;
}>();
/** Whether the dock or sheet shows its editor. */
const open = defineModel<boolean>('open', { required: true });
const state = reactive(props.form);

async function openPanel() {
  open.value = true;
  await nextTick();
  document.querySelector<HTMLElement>(DOCK_EDITOR)?.focus();
}
</script>

<template>
  <GlassCard class="flex flex-col gap-3 rounded-panel p-4" data-testid="rail-submit">
    <div class="flex items-center justify-between gap-2">
      <h2 class="font-display text-title font-bold">{{ $t('problem.rail.submit.title') }}</h2>
      <InlineBit kind="writing" />
    </div>
    <SubmitSignInLink v-if="!isSignedIn" />
    <template v-else>
      <label class="flex flex-col gap-1.5 text-sm text-muted">
        {{ $t('problem.rail.submit.language') }}
        <LanguagePicker
          class="w-full"
          :languages="problem.allowedLanguages"
          :selected-id="state.languageId"
          :selected="state.language"
          :is-sheet="false"
          @pick="state.setLanguage"
        />
      </label>
      <button
        type="button"
        class="bg-gradient-accent h-11 rounded-pill font-display font-bold text-on-accent"
        @click="openPanel"
      >
        {{ $t(open ? 'problem.rail.submit.goTo' : 'problem.rail.submit.open') }}
      </button>
      <p class="text-meta text-muted">{{ $t('problem.rail.submit.hint') }}</p>
    </template>
  </GlassCard>
</template>
