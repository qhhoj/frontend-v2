<script setup lang="ts">
import { computed, reactive, useId } from 'vue';
import type { ProblemDetail } from '@/api/types/problems';
import CodeEditor from '@/components/CodeEditor.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { formatMemoryLimit, formatNumber, formatTimeLimit } from '@/lib/format';
import { MAX_SOURCE_LENGTH, acceptedExtension } from '@/lib/source';
import FileDropzone from './FileDropzone.vue';
import LanguagePicker from './LanguagePicker.vue';
import SourceUploadButton from './SourceUploadButton.vue';
import { useLocaleStore } from '@/stores/locale.store';
import type { useSubmitForm } from './use-submit-form';

const props = defineProps<{
  problem: ProblemDetail;
  form: ReturnType<typeof useSubmitForm>;
  /**
   * `dock` is the desktop strip (a wrapping row); `sheet` the phone's column that fills the sheet's height; `full` the
   * full-screen panel: a header row (title, language, upload, actions, submit) over an editor that fills the rest.
   */
  layout: 'dock' | 'sheet' | 'full';
  /** Dock only: the editor, counter and upload are hidden; the language, the contest line, the error and submit stay. */
  collapsed?: boolean;
}>();
/** The same refs as `form`, unwrapped for the template. */
const state = reactive(props.form);
const locale = useLocaleStore();
const formatCount = (count: number) => formatNumber(count, locale.locale);
const errorId = useId();
/** Ties the error line to the control the viewer is working in. */
const errorReference = computed(() => (state.errorText ? errorId : undefined));
const submitLabelKey = computed(() => {
  if (state.submitting) return 'submit.submitting';
  return state.fileMode ? 'submit.submitFile' : 'submit.submit';
});

/**
 * Where each region sits, top to bottom (dock: left to right, wrapping). The dock keeps the actions and the submit
 * button in its top row beside the language, expanded or not, so it stays short; the sheet puts them below the editor
 * until it is collapsed, so those two have a second place.
 */
const REGION_ORDER = {
  languageRow: 'order-1',
  info: 'order-2',
  upload: 'order-3',
  actions: 'order-4 ml-auto',
  actionsCollapsed: 'order-5',
  body: 'order-6',
  message: 'order-7',
  counterRow: 'order-8',
  submit: 'order-9',
  submitCollapsed: 'order-4 ml-auto',
  /** Full screen: the actions sit right-aligned and the submit button ends the row. */
  submitLast: 'order-5',
} as const;

/** Everything that differs between the two layouts, so the template reads the same for both. */
const LAYOUTS = {
  dock: {
    form: 'flex flex-wrap items-center gap-x-3 gap-y-2',
    languageRow: '',
    body: 'basis-full',
    editor: 'max-h-[30dvh] overflow-auto rounded-tile',
    editorMinLines: 4,
    editorFill: '',
    counterRow: 'flex-1',
    submit: { size: 'md', block: false },
    header: 'contents',
  },
  sheet: {
    form: 'flex min-h-0 flex-1 flex-col gap-3',
    languageRow: 'w-full',
    body: 'flex min-h-0 flex-1 flex-col',
    editor: 'min-h-0 flex-1 overflow-auto rounded-tile',
    editorMinLines: 6,
    editorFill: '',
    counterRow: 'justify-between',
    submit: { size: 'lg', block: true },
    header: 'contents',
  },
  full: {
    form: 'flex h-full min-h-0 flex-col gap-3',
    languageRow: '',
    body: 'flex min-h-0 flex-1 flex-col',
    editor: 'min-h-0 flex-1 overflow-auto rounded-tile',
    editorMinLines: 6,
    editorFill:
      'h-full !max-h-none [&_.code-editor-host]:h-full [&_.cm-editor]:h-full [&_.code-editor-fallback]:min-h-full',
    counterRow: '',
    submit: { size: 'md', block: false },
    header: 'flex flex-wrap items-center gap-x-3 gap-y-2',
  },
} as const;
const classes = computed(() => LAYOUTS[props.layout]);
const isSheet = computed(() => props.layout === 'sheet');
/** Where the actions and submit sit: the top row of the dock, or of a collapsed form. */
const isFull = computed(() => props.layout === 'full');
const isTopRow = computed(() => props.layout !== 'sheet' || props.collapsed);
const hasSourceUpload = computed(() => !state.fileMode && !props.collapsed);
</script>

<template>
  <form :class="classes.form" @submit.prevent="state.submitNow()">
    <div :class="classes.header">
      <h2
        v-if="layout === 'full'"
        class="min-w-0 max-w-full basis-full truncate font-display text-base font-bold sm:basis-auto"
      >
        {{ problem.name }}
      </h2>
      <div class="flex items-center gap-2" :class="[REGION_ORDER.languageRow, classes.languageRow]">
        <LanguagePicker
          :languages="problem.allowedLanguages"
          :selected-id="state.languageId"
          :selected="state.language"
          :is-sheet="isSheet"
          @pick="state.setLanguage"
        />
        <RouterLink
          :to="{ name: 'runtimes' }"
          data-testid="runtimes-link"
          class="inline-flex min-h-11 shrink-0 items-center text-sm text-accent-text underline"
          >{{ $t('submit.versions') }}</RouterLink
        >
        <SourceUploadButton
          v-if="isSheet && hasSourceUpload"
          icon-only
          @pick="(file) => state.loadFile(file)"
        />
      </div>
      <span v-if="state.languageLimits" :class="REGION_ORDER.info" class="text-sm text-muted">{{
        $t('submit.limits', {
          time: formatTimeLimit(state.languageLimits.timeLimit),
          memory: formatMemoryLimit(state.languageLimits.memoryLimit),
        })
      }}</span>
      <p
        v-if="problem.contest"
        class="text-sm"
        :class="REGION_ORDER.info"
        data-testid="submit-contest"
      >
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
        :class="REGION_ORDER.upload"
        @pick="(file) => state.loadFile(file)"
      />
      <div
        v-if="$slots.actions"
        :class="isTopRow && !isFull ? REGION_ORDER.actionsCollapsed : REGION_ORDER.actions"
      >
        <slot name="actions" />
      </div>

      <AppButton
        v-if="isTopRow"
        type="submit"
        tone="primary"
        v-bind="classes.submit"
        :disabled="!state.canSubmit"
        :loading="state.submitting"
        class="shrink-0"
        :class="isFull ? REGION_ORDER.submitLast : REGION_ORDER.submitCollapsed"
        >{{ $t(submitLabelKey) }}</AppButton
      >
    </div>

    <div v-show="!collapsed" class="min-w-0" :class="[REGION_ORDER.body, classes.body]">
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
          :class="classes.editorFill"
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
      class="basis-full text-sm text-negative"
      :class="REGION_ORDER.message"
    >
      {{ state.errorText }}
    </p>
    <p
      v-if="state.resubmitUnavailable"
      role="status"
      class="basis-full text-sm text-muted"
      :class="REGION_ORDER.message"
    >
      {{ $t('submit.resubmitUnavailable') }}
    </p>

    <div
      v-if="!isSheet || !state.fileMode"
      v-show="!collapsed"
      class="flex min-w-0 items-center gap-3 text-sm"
      :class="[REGION_ORDER.counterRow, classes.counterRow]"
    >
      <template v-if="!state.fileMode">
        <span
          class="font-mono"
          :class="state.tooLong ? 'text-negative' : 'text-muted'"
          data-testid="source-counter"
          >{{ formatCount(state.length) }} / {{ formatCount(MAX_SOURCE_LENGTH) }}</span
        >
        <span v-if="state.tooLong" role="alert" class="text-negative">{{
          $t('submit.overLimit', { max: MAX_SOURCE_LENGTH })
        }}</span>
        <span v-if="state.templateRestored" class="text-muted">{{
          $t('submit.templateRestored')
        }}</span>
      </template>
    </div>
    <AppButton
      v-if="!isTopRow"
      type="submit"
      tone="primary"
      v-bind="classes.submit"
      :disabled="!state.canSubmit"
      :loading="state.submitting"
      class="shrink-0"
      :class="REGION_ORDER.submit"
      >{{ $t(submitLabelKey) }}</AppButton
    >
  </form>
</template>
