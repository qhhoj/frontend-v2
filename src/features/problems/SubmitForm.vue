<script setup lang="ts">
import { computed, reactive, useId } from 'vue';
import type { ProblemDetail } from '@/api/types/problems';
import CodeEditor from '@/components/CodeEditor.vue';
import { blockHeldEnter } from '@/components/submit-key';
import AppButton from '@/components/ui/AppButton.vue';
import Notice from '@/components/ui/Notice.vue';
import { formatMemoryLimit, formatNumber, formatTimeLimit } from '@/lib/format';
import { MAX_SOURCE_LENGTH, acceptedExtension } from '@/lib/source';
import { useContestQuery } from '@/features/contests/contests.queries';
import FileDropzone from './FileDropzone.vue';
import KeyHint from './KeyHint.vue';
import LanguagePicker from './LanguagePicker.vue';
import SourceUploadButton from './SourceUploadButton.vue';
import SubmitResultStrip from './SubmitResultStrip.vue';
import { useLocaleStore } from '@/stores/locale.store';
import { submitAriaShortcut, submitShortcutHint } from './submit-shortcuts';
import type { useSubmitForm } from './use-submit-form';

const props = defineProps<{
  problem: ProblemDetail;
  form: ReturnType<typeof useSubmitForm>;
  /**
   * `pane` is the desktop column beside the statement: a bar (language, upload, submit) over an editor that fills the
   * rest, and the slot `tools` (full screen) at the end of the line under the editor; `full` the same as a full-screen
   * panel, with the problem's name and the slot `actions` in the bar; `sheet` the phone's column that fills the sheet's
   * height, the submit button under the editor.
   */
  layout: 'pane' | 'sheet' | 'full';
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
/** The button's reason, printed while the form is idle and blocked; a failure line replaces it. */
const reasonId = useId();
const blockedReason = computed(() => (state.errorText ? null : state.blockedReason));
const submitDescribedBy = computed(() => (blockedReason.value ? reasonId : undefined));
const submitLabelKey = computed(() => {
  if (state.submitting) return 'submit.submitting';
  return state.fileMode ? 'submit.submitFile' : 'submit.submit';
});

/**
 * Where each region sits, top to bottom. The pane and the full-screen panel keep the submit button in their bar beside
 * the language, right-aligned. The full-screen panel's slot `actions` comes before it with a 16 px gap, so a dismiss
 * button is never next to it; the sheet puts the button below the editor. The result strip sits under the bar (Workbench)
 * and on top of the sheet.
 */
const REGION_ORDER = {
  languageRow: 'order-1',
  info: 'order-2',
  upload: 'order-3',
  actions: 'order-4 ml-auto',
  submitTopRow: 'order-5',
  body: 'order-6',
  message: 'order-7',
  counterRow: 'order-8',
  submit: 'order-9',
} as const;

/**
 * Everything that differs between the layouts, so the template reads the same for all. The limits and the link to the
 * runtimes page sit under the editor beside the counter.
 */
const FILLED_EDITOR = {
  form: 'flex h-full min-h-0 flex-col gap-3',
  languageRow: 'flex items-center gap-x-2',
  // The editor keeps a floor of 10 rem, so a message line above or below it never squeezes it away.
  body: 'flex min-h-40 flex-1 flex-col',
  editor: 'min-h-0 flex-1 overflow-auto rounded-cell',
  editorMinLines: 6,
  editorFill:
    'h-full !max-h-none [&_.code-editor-host]:h-full [&_.cm-editor]:h-full [&_.code-editor-fallback]:min-h-full',
  counterRow: '',
  submit: { size: 'md', block: false },
  header: 'flex flex-wrap items-center gap-x-3 gap-y-2',
  strip: 'order-1',
  /** The contest line gets its own row under the bar, so the bar keeps to one row in a narrow pane. */
  info: 'order-6 basis-full',
} as const;
const LAYOUTS = {
  pane: FILLED_EDITOR,
  full: FILLED_EDITOR,
  sheet: {
    form: 'flex min-h-min flex-1 flex-col gap-3',
    languageRow: 'grid w-full grid-cols-[minmax(0,1fr)_auto] items-center',
    // A short viewport (a phone in landscape) scrolls the sheet instead of squeezing the editor to one line.
    body: 'flex min-h-40 flex-1 flex-col',
    editor: 'min-h-0 flex-1 overflow-auto rounded-cell',
    editorMinLines: 6,
    editorFill: '',
    counterRow: 'justify-between',
    submit: { size: 'lg', block: true },
    header: 'contents',
    strip: 'order-first',
    info: REGION_ORDER.info,
  },
} as const;
const classes = computed(() => LAYOUTS[props.layout]);
const isSheet = computed(() => props.layout === 'sheet');
/** Where the actions and submit sit: the bar of the pane and the full-screen panel, or under the sheet's editor. */
const isTopRow = computed(() => props.layout !== 'sheet');
const shortcutHint = submitShortcutHint();
const hasSourceUpload = computed(() => !state.fileMode);

const hasFiles = (event: DragEvent) => event.dataTransfer?.types.includes('Files') ?? false;
/** A file dragged over the editor may be dropped; dragged text keeps the editor's own behaviour. */
function allowFileDrop(event: DragEvent) {
  if (hasFiles(event)) event.preventDefault();
}
/** A dropped file goes through the same check as the upload button; captured so CodeMirror does not insert it itself. */
function loadDroppedFile(event: DragEvent) {
  const file = event.dataTransfer?.files[0];
  if (!file) return;
  event.preventDefault();
  event.stopPropagation();
  void state.loadFile(file);
}
</script>

<template>
  <form :class="classes.form" @submit.prevent="state.submitNow()">
    <SubmitResultStrip
      v-if="state.lastSubmissionId || state.submitting"
      :result="form.result"
      :submission-id="state.submitting ? null : state.lastSubmissionId"
      class="w-full shrink-0"
      :class="classes.strip"
    />
    <!-- The viewer's last submissions to this problem (the pane only), right under the result strip. -->
    <div v-if="$slots.history" class="order-1 shrink-0"><slot name="history" /></div>
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
      </div>
      <p v-if="problem.contest" class="text-sm" :class="classes.info" data-testid="submit-contest">
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
        :icon-only="layout === 'pane'"
        :class="REGION_ORDER.upload"
        @pick="(file) => state.loadFile(file)"
      />
      <div v-if="$slots.actions" :class="REGION_ORDER.actions">
        <slot name="actions" />
      </div>

      <AppButton
        v-if="isTopRow"
        type="submit"
        tone="primary"
        v-bind="classes.submit"
        :disabled="!state.canSubmit"
        :loading="state.submitting"
        :aria-describedby="submitDescribedBy"
        class="shrink-0"
        :class="[REGION_ORDER.submitTopRow, $slots.actions ? 'ml-1' : 'ml-auto']"
        :aria-keyshortcuts="submitAriaShortcut()"
        @keydown="blockHeldEnter"
        >{{ $t(submitLabelKey) }}<KeyHint :keys="shortcutHint"
      /></AppButton>
    </div>

    <div class="min-w-0" :class="[REGION_ORDER.body, classes.body]">
      <div
        v-if="!state.fileMode"
        role="group"
        :aria-label="$t('submit.source')"
        :aria-describedby="errorReference"
        :class="classes.editor"
        @dragover="allowFileDrop"
        @drop.capture="loadDroppedFile"
      >
        <CodeEditor
          v-model="state.source"
          :label="$t('submit.source')"
          :language="state.language?.ace ?? null"
          :min-lines="classes.editorMinLines"
          class="min-h-full"
          :class="classes.editorFill"
          @request-submit="state.submitNow()"
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
    <Notice
      v-if="state.errorText"
      :id="errorId"
      tone="danger"
      inline
      class="shrink-0"
      :class="REGION_ORDER.message"
    >
      {{ state.errorText }}
    </Notice>
    <p
      v-else-if="blockedReason"
      :id="reasonId"
      class="shrink-0 text-sm text-muted"
      :class="REGION_ORDER.message"
    >
      {{ blockedReason }}
    </p>
    <p
      v-if="state.resubmitUnavailable"
      role="status"
      class="shrink-0 text-sm text-muted"
      :class="REGION_ORDER.message"
    >
      {{ $t('submit.resubmitUnavailable') }}
    </p>

    <div
      class="flex min-w-0 flex-wrap items-center gap-x-3 text-sm"
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
      <span v-if="state.languageLimits" class="text-muted">{{
        $t('submit.limits', {
          time: formatTimeLimit(state.languageLimits.timeLimit),
          memory: formatMemoryLimit(state.languageLimits.memoryLimit),
        })
      }}</span>
      <RouterLink
        :to="{ name: 'runtimes' }"
        data-testid="runtimes-link"
        class="inline-flex min-h-11 items-center text-muted underline hover:text-content"
        >{{ $t('submit.versions') }}</RouterLink
      >
      <div v-if="$slots.tools" class="ml-auto">
        <slot name="tools" />
      </div>
    </div>
    <AppButton
      v-if="!isTopRow"
      type="submit"
      tone="primary"
      v-bind="classes.submit"
      :disabled="!state.canSubmit"
      :loading="state.submitting"
      :aria-describedby="submitDescribedBy"
      class="shrink-0"
      :class="REGION_ORDER.submit"
      @keydown="blockHeldEnter"
      >{{ $t(submitLabelKey) }}</AppButton
    >
  </form>
</template>
