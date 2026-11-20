<script setup lang="ts">
import { computed, useTemplateRef, watch } from 'vue';
import type { ProblemData } from '@/api/types/problem-data';
import type { EditableProblem } from '@/api/types/problem-editing';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AppButton from '@/components/ui/AppButton.vue';
import Card from '@/components/ui/Card.vue';
import Checkbox from '@/components/ui/Checkbox.vue';
import Chip from '@/components/ui/Chip.vue';
import Disclosure from '@/components/ui/Disclosure.vue';
import Lamp from '@/components/ui/Lamp.vue';
import Notice from '@/components/ui/Notice.vue';
import { translate } from '@/i18n';
import { formatFileSize } from '@/lib/format';
import AdminStatus from '../../ui/AdminStatus.vue';
import { UPLOAD_LIMITS } from '../../ui/upload-limits';
import CasesAutofill from '../data/CasesAutofill.vue';
import CasesEditor from '../data/CasesEditor.vue';
import CheckerSection from '../data/CheckerSection.vue';
import ChunkedUploadStatus from '../data/chunked-upload/ChunkedUploadStatus.vue';
import DataArchiveCard from '../data/DataArchiveCard.vue';
import DataFeedback from '../data/DataFeedback.vue';
import TestDropZone from '../data/TestDropZone.vue';
import { ARCHIVE_PREVIEW_COUNT } from '../data/test-cases';
import { useTestUpload } from '../data/use-test-upload';
import type { TrialResults } from '../data/trial-results';
import { pairArchiveFiles } from '../data/zip-autofill';
import { failureReasonOf } from '../failure-reason';
import type { Workbench } from './use-workbench';
import type { TestsSummary } from './workbench-summary';

/**
 * Section 3. Left: the drop zone (a zip or loose files, stored at once, as an upload always was), the tests made from
 * the archive's pairs, the test table with its groups and points, a total line that says whether the points add up to
 * the problem's, and the archive's files that are no test. Right, from the width where both fit (under the table below
 * it): the judging panel: how a result is compared (with the checker or interactor file), the input/output method,
 * partial scoring, and one fold for the rest. The table, the panel and partial scoring wait for the page's save.
 * `trial` is the last trial run of section 4: the table shows what it got on each test. `stored` tells the page that an
 * upload replaced the test files (a run from before it is then old).
 */
const props = defineProps<{
  problem: EditableProblem;
  data: Workbench['data'];
  info: Workbench['info'];
  summary: TestsSummary | null;
  trial: TrialResults;
}>();
const emit = defineEmits<{ stored: [] }>();
const { query, form, errors, badRows, markInvalid, adopt } = props.data;
const { form: infoForm } = props.info;
const KEY = 'admin.problems.workbench.tests';
const DROP = 'admin.problems.data.drop';
const AUTOFILL = 'admin.problems.data.autofill';
const autofill = useTemplateRef<InstanceType<typeof CasesAutofill>>('autofill');

/**
 * After an upload: the form takes the server's answer first (when it holds no edits), then the archive's pairs become
 * tests in the table at once, as an unsaved change. The answer's own file list is used, not the query's (it updates later).
 */
function onStored(saved: ProblemData) {
  adopt(saved);
  emit('stored');
  autofill.value?.start(saved.archiveFiles, form.value?.cases);
}
const upload = useTestUpload(
  () => props.problem.code,
  () => Boolean(query.data.value?.archive),
  onStored,
);
const { chunked } = upload;
const refusalText = computed(() => {
  const refusal = upload.refusal.value;
  if (!refusal) return '';
  if (refusal.reason === 'busy') return translate('common.upload.busy');
  return translate(`${DROP}.refused.${refusal.reason}`, {
    name: refusal.name ?? '',
    max: formatFileSize(UPLOAD_LIMITS.archive),
  });
});

/** The bar's words name what happens: one `.zip` replaces the archive, or the loose files replace it. */
const replaceBody = computed(() => {
  const waiting = upload.waiting.value;
  if (!waiting) return '';
  const stored = query.data.value?.archiveFiles.length ?? 0;
  return waiting.kind === 'zip'
    ? translate(`${DROP}.replaceZipBody`, { name: waiting.file.name, stored })
    : translate(`${DROP}.replaceBody`, { count: waiting.files.length, stored });
});
const replaceConfirm = computed(() => {
  const waiting = upload.waiting.value;
  if (!waiting) return '';
  return waiting.kind === 'zip'
    ? translate(`${DROP}.replaceZipConfirm`, { name: waiting.file.name })
    : translate(`${DROP}.replaceConfirm`, { count: waiting.files.length });
});

/** A row whose args box does not parse blocks the save: the table names the tests and groups. */
const tableErrors = computed(() =>
  badRows.value.length > 0
    ? {
        ...errors.value,
        cases: translate('admin.problems.data.cases.badJsonRows', {
          rows: badRows.value
            .map((shown) =>
              translate(`admin.problems.data.cases.rowName.${shown.kind}`, { n: shown.number }),
            )
            .join(', '),
        }),
      }
    : errors.value,
);

/** The archive's files that are no test: inputs and outputs without a partner, and files that are neither. */
const leftovers = computed(() => pairArchiveFiles(query.data.value?.archiveFiles ?? []));
const preview = (files: string[]) => ({
  shown: files.slice(0, ARCHIVE_PREVIEW_COUNT),
  hidden: Math.max(0, files.length - ARCHIVE_PREVIEW_COUNT),
});
const FILE_LIST = 'm-0 flex list-none flex-wrap items-center gap-1 p-0';

const isAdvancedOpen = defineModel<boolean>('advancedOpen', { default: false });
/** A stored setting that lives in the fold opens it, so no part of the judging stays out of sight. */
watch(
  () => form.value?.grader,
  (grader) => {
    if (grader === 'signature' || grader === 'output_only') isAdvancedOpen.value = true;
  },
  { immediate: true },
);
</script>

<template>
  <QueryState
    :loading="query.isPending.value"
    :error="query.error.value"
    @retry="() => void query.refetch()"
  >
    <template #skeleton>
      <SkeletonBlock data-skeleton-region="problem-data-card" class="h-24 w-full rounded-card" />
      <SkeletonBlock data-skeleton-region="problem-data-cases" class="h-96 w-full rounded-card" />
    </template>
    <div v-if="query.data.value && form" class="flex flex-col gap-4">
      <AdminStatus
        v-if="problem.externalJudge"
        kind="queued"
        data-testid="external-judge-note"
        :text="$t('admin.externalJudge.dataNote', { oj: problem.externalJudge.oj })"
      />
      <DataFeedback :feedback="query.data.value.feedback" />
      <div
        class="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_var(--qh-sidebar-width)] xl:items-start"
      >
        <div class="flex min-w-0 flex-col gap-3">
          <TestDropZone
            :is-pending="upload.isBusy.value"
            @files="upload.take"
            @folder="upload.refuse('folder')"
          />
          <Notice v-if="refusalText" tone="danger" inline data-testid="drop-refusal">
            {{ refusalText }}
          </Notice>
          <Notice
            v-if="upload.waiting.value"
            tone="warning"
            role="alert"
            data-testid="replace-archive"
            :title="$t(`${DROP}.replaceTitle`, { archive: query.data.value.archive })"
          >
            {{ replaceBody }}
            <template #action>
              <div class="flex flex-wrap gap-2">
                <AppButton size="sm" tone="secondary" @click="upload.cancelReplace">
                  {{ $t('common.cancel') }}
                </AppButton>
                <AppButton
                  size="sm"
                  tone="danger"
                  data-testid="replace-archive-confirm"
                  @click="upload.confirmReplace"
                >
                  {{ replaceConfirm }}
                </AppButton>
              </div>
            </template>
          </Notice>
          <p v-if="upload.isPacking.value" role="status" class="m-0 text-meta text-muted">
            {{ $t(`${DROP}.packing`) }}
          </p>
          <ChunkedUploadStatus
            v-if="chunked.phase.value || upload.interrupted.value"
            :phase="chunked.phase.value"
            :done-bytes="chunked.doneBytes.value"
            :total-bytes="chunked.totalBytes.value"
            :chunk-number="chunked.chunkNumber.value"
            :chunk-count="chunked.chunkCount.value"
            :finishing="chunked.finishing.value"
            :interrupted-name="upload.interrupted.value?.file.name ?? null"
            @cancel="chunked.cancel"
            @resume="upload.resume"
          />
          <Notice v-if="upload.failure.value" tone="danger" inline data-testid="upload-failure">
            {{ failureReasonOf(upload.failure.value) }}
          </Notice>
          <DataArchiveCard :code="problem.code" :data="query.data.value" />
          <CasesAutofill
            ref="autofill"
            v-model="form.cases"
            :archive-files="query.data.value.archiveFiles"
            :problem-points="problem.points"
            @invalid="markInvalid"
          />
          <CasesEditor
            v-model="form.cases"
            :data="query.data.value"
            :errors="tableErrors"
            :trial="trial"
            @invalid="markInvalid"
          >
            <template #total>
              <p
                v-if="summary"
                data-testid="tests-total"
                class="m-0 flex flex-wrap items-center gap-2 text-meta text-secondary"
              >
                <Lamp :tone="summary.isAddingUp ? 'ac' : 'none'" still />
                {{ $t(`${KEY}.total`, { ...summary }) }}
                <span v-if="!summary.isAddingUp" class="text-muted">{{
                  $t(`${KEY}.totalOff`)
                }}</span>
              </p>
            </template>
            <template #actions>
              <AppButton
                v-if="autofill?.newPairCount && !autofill.live"
                size="sm"
                tone="secondary"
                data-testid="zip-autofill-open"
                @click="autofill.start()"
              >
                {{ $t('admin.problems.data.cases.autofill') }}
              </AppButton>
            </template>
          </CasesEditor>
          <Notice
            v-if="query.data.value.archiveFiles.length > 0 && leftovers.pairs.length === 0"
            tone="info"
            compact
            data-testid="autofill-no-pairs"
            :title="$t(`${AUTOFILL}.noPairs`)"
          >
            {{ $t(`${AUTOFILL}.rules`) }}
          </Notice>
          <Notice
            v-if="leftovers.unpaired.length > 0"
            tone="warning"
            compact
            role="status"
            data-testid="autofill-unpaired"
            :title="$t(`${AUTOFILL}.unpaired`, { count: leftovers.unpaired.length })"
          >
            {{ $t(`${AUTOFILL}.unpairedHint`) }}
            <template #details>
              <ul :class="FILE_LIST">
                <li v-for="file in preview(leftovers.unpaired).shown" :key="file">
                  <Chip
                    ><span class="font-mono">{{ file }}</span></Chip
                  >
                </li>
                <li v-if="preview(leftovers.unpaired).hidden > 0" class="text-meta text-muted">
                  {{
                    $t('admin.problems.data.archive.more', {
                      count: preview(leftovers.unpaired).hidden,
                    })
                  }}
                </li>
              </ul>
            </template>
          </Notice>
          <Disclosure
            v-if="leftovers.others.length > 0"
            :label="$t(`${AUTOFILL}.others`, { count: leftovers.others.length })"
          >
            <ul :class="[FILE_LIST, 'pb-3']">
              <li v-for="file in preview(leftovers.others).shown" :key="file">
                <Chip
                  ><span class="font-mono">{{ file }}</span></Chip
                >
              </li>
              <li v-if="preview(leftovers.others).hidden > 0" class="text-meta text-muted">
                {{
                  $t('admin.problems.data.archive.more', {
                    count: preview(leftovers.others).hidden,
                  })
                }}
              </li>
            </ul>
          </Disclosure>
        </div>
        <Card panel as="div" :title="$t(`${KEY}.judging`)" data-testid="judging-panel">
          <div class="flex flex-col gap-4">
            <CheckerSection
              v-model="form"
              part="main"
              :code="problem.code"
              :data="query.data.value"
              :errors="errors"
            />
            <Checkbox
              v-model="infoForm.partial"
              input-id="problem-partial"
              data-testid="problem-partial"
              :label="$t('admin.problems.general.limits.partial')"
              :description="$t('admin.problems.general.limits.partialHint')"
            />
            <div class="border-t border-line">
              <Disclosure v-model:open="isAdvancedOpen" :label="$t(`${KEY}.advanced`)">
                <CheckerSection
                  v-model="form"
                  part="more"
                  :code="problem.code"
                  :data="query.data.value"
                  :errors="errors"
                />
              </Disclosure>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </QueryState>
</template>
