<script setup lang="ts">
import { computed, reactive, useId } from 'vue';
import type { ProblemDetail } from '@/api/types/problems';
import CodeEditor from '@/components/CodeEditor.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { formatMemoryLimit, formatNumber, formatTimeLimit } from '@/lib/format';
import { MAX_SOURCE_LENGTH, acceptedExtension } from '@/lib/source';
import { useContestQuery } from '@/features/contests/contests.queries';
import FileDropzone from './FileDropzone.vue';
import LanguagePicker from './LanguagePicker.vue';
import SourceUploadButton from './SourceUploadButton.vue';
import SubmitResultStrip from './SubmitResultStrip.vue';
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
}>();
/** The same refs as `form`, unwrapped for the template. */
const state = reactive(props.form);
/** The contest line names the contest, never its raw key; the problem page's rail has read it already. */
const contestKey = computed(() => props.problem.contest?.contestKey ?? null);
const { data: contest } = useContestQuery(
  () => contestKey.value ?? '',
  () => contestKey.value !== null,
);
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
 * button in its top row beside the language, so it stays short; the sheet puts them below the editor.
 */
const REGION_ORDER = {
  languageRow: 'order-1',
  info: 'order-2',
  upload: 'order-3',
  actions: 'order-4 ml-auto',
  actionsTopRow: 'order-5',
  body: 'order-6',
  message: 'order-7',
  counterRow: 'order-8',
  submit: 'order-9',
  submitTopRow: 'order-4 ml-auto',
  /** Full screen: the actions sit right-aligned and the submit button ends the row. */
  submitLast: 'order-5',
} as const;

/**
 * Everything that differs between the layouts, so the template reads the same for all. `versionsLink` is the link to the
 * runtimes page: beside the language on the dock and full screen, on its own line under the picker and the upload button
 * on the sheet (a grid: the picker takes the row's width, whether or not the upload button is there), so the picker stays
 * usable on a 320 px phone.
 */
const LAYOUTS = {
  dock: {
    form: 'flex flex-wrap items-center gap-x-3 gap-y-2',
    languageRow: 'flex items-center gap-x-2',
    versionsLink: 'shrink-0',
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
    languageRow: 'grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-y-1',
    versionsLink: 'col-span-2 justify-self-start',
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
    languageRow: 'flex items-center gap-x-2',
    versionsLink: 'shrink-0',
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
/** Where the actions and submit sit: the top row of the dock and the full-screen panel, or under the sheet's editor. */
const isFull = computed(() => props.layout === 'full');
const isTopRow = computed(() => props.layout !== 'sheet');
const hasSourceUpload = computed(() => !state.fileMode);
</script>

<template>
  <form :class="classes.form" @submit.prevent="state.submitNow()">
    <SubmitResultStrip
      v-if="state.lastSubmissionId"
      :result="form.result"
      :submission-id="state.lastSubmissionId"
      class="order-first w-full shrink-0"
    />
    <div :class="classes.header">
      <h2
        v-if="layout === 'full'"
        class="min-w-0 max-w-full basis-full truncate font-display text-base font-bold sm:basis-auto"
      >
        {{ problem.name }}
      </h2>
      <div :class="[REGION_ORDER.languageRow, classes.languageRow]">
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
          class="ml-2"
          @pick="(file) => state.loadFile(file)"
        />
        <RouterLink
          :to="{ name: 'runtimes' }"
          data-testid="runtimes-link"
          class="inline-flex min-h-11 items-center text-sm text-accent-text underline"
          :class="classes.versionsLink"
          >{{ $t('submit.versions') }}</RouterLink
        >
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
          >{{
            $t('submit.inContest', { name: contest?.name ?? problem.contest.contestKey })
          }}</RouterLink
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
        :class="isTopRow && !isFull ? REGION_ORDER.actionsTopRow : REGION_ORDER.actions"
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
        :class="isFull ? REGION_ORDER.submitLast : REGION_ORDER.submitTopRow"
        >{{ $t(submitLabelKey) }}</AppButton
      >
    </div>

    <div class="min-w-0" :class="[REGION_ORDER.body, classes.body]">
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
