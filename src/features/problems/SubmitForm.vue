<script setup lang="ts">
import { FileUp, Upload, X } from 'lucide-vue-next';
import Select from 'primevue/select';
import { reactive, useId } from 'vue';
import type { ProblemDetail } from '@/api/types/problems';
import CodeEditor from '@/components/CodeEditor.vue';
import { formatMemoryLimit, formatTimeLimit } from '@/lib/format';
import { MAX_SOURCE_LENGTH, acceptedExtension } from '@/lib/source';
import type { useSubmitForm } from './use-submit-form';

const props = defineProps<{
  problem: ProblemDetail;
  form: ReturnType<typeof useSubmitForm>;
  /** The editor, counter and upload are hidden; the language, the contest line, the error and submit stay. */
  collapsed?: boolean;
}>();
/** The same refs as `form`, unwrapped for the template. */
const state = reactive(props.form);
const uploadInputId = useId();
const fileInputId = useId();
const EDITOR_MIN_LINES = 8;

/** The same file picked twice must fire `change` again, so the input is emptied after each read. */
function takePickedFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const [file] = input.files ?? [];
  input.value = '';
  return file;
}
function onSourceFilePicked(event: Event) {
  const file = takePickedFile(event);
  if (file) void state.loadFile(file);
}
function onUploadFilePicked(event: Event) {
  const file = takePickedFile(event);
  if (file) state.chooseFile(file);
}
</script>

<template>
  <form class="flex flex-wrap items-center gap-x-3 gap-y-2" @submit.prevent="state.submitNow()">
    <Select
      :model-value="state.languageId"
      :options="problem.allowedLanguages"
      option-label="name"
      option-value="id"
      :aria-label="$t('submit.language')"
      class="order-1 min-w-44"
      @update:model-value="state.setLanguage"
    >
      <template #value>
        {{ state.language?.name }}
        <span
          v-if="state.fileMode"
          class="ml-2 rounded-pill bg-surface-strong px-2 text-xs text-muted"
          >{{ $t('submit.fileOnly') }}</span
        >
      </template>
      <template #option="{ option }">
        {{ option.name }}
        <span
          v-if="option.fileOnly"
          class="ml-2 rounded-pill bg-surface-strong px-2 text-xs text-muted"
          >{{ $t('submit.fileOnly') }}</span
        >
      </template>
    </Select>
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
    <template v-if="!state.fileMode && !collapsed">
      <input :id="uploadInputId" type="file" class="peer sr-only" @change="onSourceFilePicked" />
      <label
        :for="uploadInputId"
        class="order-3 inline-flex h-11 cursor-pointer items-center gap-2 rounded-pill border border-line bg-surface px-4 text-sm hover:bg-surface-hover peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus"
      >
        <Upload class="size-4" aria-hidden="true" />
        {{ $t('submit.upload') }}
      </label>
    </template>
    <div :class="collapsed ? 'order-5' : 'order-4 ml-auto'">
      <slot name="actions" />
    </div>

    <div v-show="!collapsed" class="order-6 min-w-0 basis-full">
      <div v-if="!state.fileMode" class="max-h-[45dvh] overflow-auto rounded-tile">
        <CodeEditor
          v-model="state.source"
          :label="$t('submit.source')"
          :language="state.language?.ace ?? null"
          :min-lines="EDITOR_MIN_LINES"
        />
      </div>
      <div v-else class="flex flex-col gap-2">
        <p
          v-if="state.uploadsOff"
          class="rounded-tile border border-dashed border-line p-4 text-sm text-muted"
        >
          {{ $t('submit.file.uploadDisabled') }}
        </p>
        <template v-else>
          <input
            :id="fileInputId"
            type="file"
            :accept="acceptedExtension(state.language!)"
            class="peer sr-only"
            @change="onUploadFilePicked"
          />
          <label
            :for="fileInputId"
            class="flex h-24 cursor-pointer items-center justify-center gap-2 rounded-tile border border-dashed border-line-accent bg-accent-soft text-sm text-accent-soft-text peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus"
          >
            <FileUp class="size-5" aria-hidden="true" />
            {{ $t('submit.file.choose', { extension: acceptedExtension(state.language!) }) }}
          </label>
        </template>
        <div
          v-if="state.chosenFile"
          class="flex items-center gap-2 rounded-tile bg-surface-strong px-3 py-1 text-sm"
        >
          <span class="min-w-0 flex-1 truncate" :title="state.chosenFile.name">{{
            state.chosenFile.name
          }}</span>
          <button
            type="button"
            :aria-label="$t('submit.file.remove')"
            class="flex size-11 shrink-0 items-center justify-center rounded-pill text-muted hover:bg-surface-hover"
            @click="state.clearFile()"
          >
            <X class="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
    <p v-if="state.errorText" role="alert" class="order-7 basis-full text-sm text-negative">
      {{ state.errorText }}
    </p>
    <p v-if="state.resubmitUnavailable" role="status" class="order-7 basis-full text-sm text-muted">
      {{ $t('submit.resubmitUnavailable') }}
    </p>

    <div v-show="!collapsed" class="order-8 flex min-w-0 flex-1 items-center gap-3 text-sm">
      <template v-if="!state.fileMode">
        <span
          class="font-mono"
          :class="state.tooLong ? 'text-negative' : 'text-muted'"
          data-testid="source-counter"
          >{{ state.length }} / {{ MAX_SOURCE_LENGTH }}</span
        >
        <span v-if="state.tooLong" role="alert" class="sr-only">{{
          $t('submit.errors.sourceLength', { max: MAX_SOURCE_LENGTH })
        }}</span>
        <span v-if="state.templateRestored" class="text-muted">{{
          $t('submit.templateRestored')
        }}</span>
      </template>
    </div>
    <button
      type="submit"
      :aria-disabled="!state.canSubmit"
      class="bg-gradient-accent h-11 shrink-0 rounded-pill px-6 font-display font-bold text-on-accent aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
      :class="collapsed ? 'order-4 ml-auto' : 'order-9'"
    >
      {{
        $t(
          state.submitting
            ? 'submit.submitting'
            : state.fileMode
              ? 'submit.submitFile'
              : 'submit.submit',
        )
      }}
    </button>
  </form>
</template>
