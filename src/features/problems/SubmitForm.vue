<script setup lang="ts">
import { computed, reactive, useId } from 'vue';
import type { ProblemDetail } from '@/api/types/problems';
import CodeEditor from '@/components/CodeEditor.vue';
import { formatMemoryLimit, formatTimeLimit } from '@/lib/format';
import { MAX_SOURCE_LENGTH, acceptedExtension } from '@/lib/source';
import FileDropzone from './FileDropzone.vue';
import LanguagePicker from './LanguagePicker.vue';
import SourceUploadButton from './SourceUploadButton.vue';
import type { useSubmitForm } from './use-submit-form';

const props = defineProps<{
  problem: ProblemDetail;
  form: ReturnType<typeof useSubmitForm>;
  /** `dock` is the desktop strip (a wrapping row); `sheet` the phone's column that fills the sheet's height. */
  layout: 'dock' | 'sheet';
  /** Dock only: the editor, counter and upload are hidden; the language, the contest line, the error and submit stay. */
  collapsed?: boolean;
}>();
/** The same refs as `form`, unwrapped for the template. */
const state = reactive(props.form);
const errorId = useId();
/** Ties the error line to the control the viewer is working in. */
const errorReference = computed(() => (state.errorText ? errorId : undefined));
const submitLabelKey = computed(() => {
  if (state.submitting) return 'submit.submitting';
  return state.fileMode ? 'submit.submitFile' : 'submit.submit';
});

/** Everything that differs between the two layouts, so the template reads the same for both. */
const LAYOUTS = {
  dock: {
    form: 'flex flex-wrap items-center gap-x-3 gap-y-2',
    languageRow: '',
    body: 'basis-full',
    editor: 'max-h-[45dvh] overflow-auto rounded-tile',
    editorMinLines: 8,
    counterRow: 'flex-1',
    submit: 'h-11 px-6',
  },
  sheet: {
    form: 'flex min-h-0 flex-1 flex-col gap-3',
    languageRow: 'w-full',
    body: 'flex min-h-0 flex-1 flex-col',
    editor: 'min-h-0 flex-1 overflow-auto rounded-tile',
    editorMinLines: 6,
    counterRow: 'justify-between',
    submit: 'h-14 w-full',
  },
} as const;
const classes = computed(() => LAYOUTS[props.layout]);
const isSheet = computed(() => props.layout === 'sheet');
const hasSourceUpload = computed(() => !state.fileMode && !props.collapsed);
</script>

<template>
  <form :class="classes.form" @submit.prevent="state.submitNow()">
    <div class="order-1 flex items-center gap-2" :class="classes.languageRow">
      <LanguagePicker
        :languages="problem.allowedLanguages"
        :selected-id="state.languageId"
        :selected="state.language"
        :is-sheet="isSheet"
        @pick="state.setLanguage"
      />
      <SourceUploadButton
        v-if="isSheet && hasSourceUpload"
        icon-only
        @pick="(file) => state.loadFile(file)"
      />
    </div>
    <span v-if="state.languageLimits" class="order-2 text-sm text-muted">{{
      $t('submit.limits', {
        time: formatTimeLimit(state.languageLimits.timeLimit),
        memory: formatMemoryLimit(state.languageLimits.memoryLimit),
      })
    }}</span>
    <p v-if="problem.contest" class="order-2 text-sm" data-testid="submit-contest">
      <RouterLink
        :to="`/contests/${encodeURIComponent(problem.contest.contestKey)}`"
        class="font-semibold text-accent underline"
        >{{ $t('submit.inContest', { key: problem.contest.contestKey }) }}</RouterLink
      >
      <template v-if="state.attemptsLeft !== null">
        ·
        <span :class="state.attemptsLeft === 0 ? 'text-negative' : 'text-muted'">{{
          state.attemptsLeft === 0
            ? $t('submit.attemptsNone')
            : $t('submit.attemptsLeft', { count: state.attemptsLeft }, state.attemptsLeft)
        }}</span>
      </template>
    </p>
    <SourceUploadButton
      v-if="!isSheet && hasSourceUpload"
      :icon-only="false"
      class="order-3"
      @pick="(file) => state.loadFile(file)"
    />
    <div v-if="$slots.actions" :class="collapsed ? 'order-5' : 'order-4 ml-auto'">
      <slot name="actions" />
    </div>

    <div v-show="!collapsed" class="order-6 min-w-0" :class="classes.body">
      <div
        v-if="!state.fileMode"
        role="group"
        :aria-label="$t('submit.source')"
        :aria-describedby="errorReference"
        :class="classes.editor"
      >
        <CodeEditor
          v-model="state.source"
          :label="$t('submit.source')"
          :language="state.language?.ace ?? null"
          :min-lines="classes.editorMinLines"
          class="min-h-full"
        />
      </div>
      <div v-else-if="state.language" class="flex flex-col gap-2">
        <p v-if="!state.uploadsOff" class="text-sm text-muted">
          {{ $t('submit.fileHelp', { extension: acceptedExtension(state.language) }) }}
        </p>
        <FileDropzone
          :language="state.language"
          :file="state.chosenFile"
          :disabled="state.uploadsOff"
          :described-by="errorReference"
          @choose="state.chooseFile"
          @remove="state.clearFile()"
        />
      </div>
    </div>
    <p
      v-if="state.errorText"
      :id="errorId"
      role="alert"
      class="order-7 basis-full text-sm text-negative"
    >
      {{ state.errorText }}
    </p>
    <p v-if="state.resubmitUnavailable" role="status" class="order-7 basis-full text-sm text-muted">
      {{ $t('submit.resubmitUnavailable') }}
    </p>

    <div
      v-if="!isSheet || !state.fileMode"
      v-show="!collapsed"
      class="order-8 flex min-w-0 items-center gap-3 text-sm"
      :class="classes.counterRow"
    >
      <template v-if="!state.fileMode">
        <span
          class="font-mono"
          :class="state.tooLong ? 'text-negative' : 'text-muted'"
          data-testid="source-counter"
          >{{ state.length }} / {{ MAX_SOURCE_LENGTH }}</span
        >
        <span v-if="state.tooLong" role="alert" class="text-negative">{{
          $t('submit.overLimit', { max: MAX_SOURCE_LENGTH })
        }}</span>
        <span v-if="state.templateRestored" class="text-muted">{{
          $t('submit.templateRestored')
        }}</span>
      </template>
    </div>
    <button
      type="submit"
      :aria-disabled="!state.canSubmit"
      class="bg-gradient-accent shrink-0 rounded-pill font-display font-bold text-on-accent aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
      :class="[classes.submit, collapsed ? 'order-4 ml-auto' : 'order-9']"
    >
      {{ $t(submitLabelKey) }}
    </button>
  </form>
</template>
