<script setup lang="ts">
import { computed, ref } from 'vue';
import { uploadDataArchive } from '@/api/problem-data.api';
import type { ProblemData } from '@/api/types/problem-data';
import type { EditableProblem } from '@/api/types/problem-editing';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { translate } from '@/i18n';
import Card from '@/components/ui/Card.vue';
import Checkbox from '@/components/ui/Checkbox.vue';
import Disclosure from '@/components/ui/Disclosure.vue';
import Lamp from '@/components/ui/Lamp.vue';
import UploadButton from '@/components/ui/UploadButton.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { UPLOAD_LIMITS } from '../../ui/upload-limits';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import CasesAutofill from '../data/CasesAutofill.vue';
import CasesEditor from '../data/CasesEditor.vue';
import CheckerSection from '../data/CheckerSection.vue';
import DataArchiveCard from '../data/DataArchiveCard.vue';
import DataFeedback from '../data/DataFeedback.vue';
import { SINGLE_UPLOAD_MAX_BYTES } from '../data/chunked-upload/chunk-plan';
import ChunkedUploadStatus from '../data/chunked-upload/ChunkedUploadStatus.vue';
import { UPLOAD_CANCELLED, useChunkedUpload } from '../data/chunked-upload/use-chunked-upload';
import { useKeepDataAnswer } from '../data/problem-data.queries';
import { pairArchiveFiles } from '../data/zip-autofill';
import { failureReasonOf } from '../failure-reason';
import type { TestsSummary } from './workbench-summary';
import type { Workbench } from './use-workbench';

/**
 * Section 3: the test archive (uploaded at once, as before), the test table with its groups and points and a total line
 * that says whether the points add up to the problem's, then the judging panel: how answers are compared (with the
 * checker, interactor and header files), the input/output method, partial scoring, and a fold for the rarely used options.
 * The table, the panel and partial scoring wait for the page's save.
 */
const props = defineProps<{
  problem: EditableProblem;
  data: Workbench['data'];
  info: Workbench['info'];
  summary: TestsSummary | null;
}>();
const { query, form, errors, badRowNumbers, markInvalid } = props.data;
const { form: infoForm } = props.info;
const KEY = 'admin.problems.workbench.tests';
const keepAnswer = useKeepDataAnswer(() => props.problem.code);
const isAutofillOpen = ref(false);
const isAutofillAfterUpload = ref(false);
const chunked = useChunkedUpload(() => props.problem.code);
/**
 * An upload only stores the zip: the tests are made from it next, so that dialog opens at once when the zip has pairs.
 * A zip larger than one request goes in chunks (resumable in this tab); a smaller one in a single request.
 */
const archive = useAdminMutation({
  mutate: (file: File) =>
    file.size > SINGLE_UPLOAD_MAX_BYTES
      ? chunked.upload(file)
      : uploadDataArchive(props.problem.code, file),
  onDone: (saved: ProblemData) => {
    keepAnswer(saved);
    if (pairArchiveFiles(saved.archiveFiles).pairs.length === 0) return;
    isAutofillAfterUpload.value = true;
    isAutofillOpen.value = true;
  },
});
/** A cancel is the user's own doing: no refusal line for it. */
const archiveFailure = computed(() =>
  archive.failure.value?.code === UPLOAD_CANCELLED ? null : archive.failure.value,
);
/** Only the upload started on this problem is offered to resume here. */
const interruptedHere = computed(() =>
  chunked.interrupted.value?.code === props.problem.code ? chunked.interrupted.value : null,
);
function resumeArchive() {
  const file = interruptedHere.value?.file;
  if (file) void archive.run(file);
}
/** A row whose args box does not parse blocks the save: the table names the rows. */
const tableErrors = computed(() =>
  badRowNumbers.value.length > 0
    ? {
        ...errors.value,
        cases: translate('admin.problems.data.cases.badJsonRows', {
          rows: badRowNumbers.value.join(', '),
        }),
      }
    : errors.value,
);
const isAdvancedOpen = defineModel<boolean>('advancedOpen', { default: false });
</script>

<template>
  <QueryState
    :loading="query.isPending.value"
    :error="query.error.value"
    @retry="() => void query.refetch()"
  >
    <template #skeleton>
      <SkeletonBlock data-skeleton-region="problem-data-card" class="h-40 w-full rounded-row" />
      <SkeletonBlock data-skeleton-region="problem-data-cases" class="h-96 w-full rounded-row" />
    </template>
    <div v-if="query.data.value && form" class="flex flex-col gap-4">
      <AdminStatus
        v-if="problem.externalJudge"
        kind="queued"
        data-testid="external-judge-note"
        :text="$t('admin.externalJudge.dataNote', { oj: problem.externalJudge.oj })"
      />
      <DataFeedback :feedback="query.data.value.feedback" />
      <Card as="div">
        <DataArchiveCard :code="problem.code" :data="query.data.value">
          <template #upload>
            <UploadButton
              data-testid="upload-archive"
              :label="$t('admin.problems.uploads.archive.upload')"
              accept=".zip"
              :max-bytes="UPLOAD_LIMITS.archive"
              :is-pending="archive.isPending.value"
              @picked="archive.run"
            />
            <CasesAutofill
              v-model="form.cases"
              v-model:open="isAutofillOpen"
              v-model:after-upload="isAutofillAfterUpload"
              :archive-files="query.data.value.archiveFiles"
              :problem-points="problem.points"
              @invalid="markInvalid"
            />
          </template>
        </DataArchiveCard>
        <div v-if="chunked.phase.value || interruptedHere" class="px-4 pb-4">
          <ChunkedUploadStatus
            :phase="chunked.phase.value"
            :done-bytes="chunked.doneBytes.value"
            :total-bytes="chunked.totalBytes.value"
            :chunk-number="chunked.chunkNumber.value"
            :chunk-count="chunked.chunkCount.value"
            :finishing="chunked.finishing.value"
            :interrupted-name="interruptedHere?.file.name ?? null"
            @cancel="chunked.cancel"
            @resume="resumeArchive"
          />
        </div>
        <div v-if="archiveFailure" class="px-4 pb-4">
          <AdminStatus kind="refused" :text="failureReasonOf(archiveFailure)" />
        </div>
      </Card>
      <Card as="div">
        <CasesEditor
          v-model="form.cases"
          :data="query.data.value"
          :errors="tableErrors"
          :problem-points="problem.points"
          @invalid="markInvalid"
        />
        <p
          v-if="summary"
          data-testid="tests-total"
          class="m-0 flex items-center gap-2 border-t border-line px-4 py-3 text-meta text-secondary"
        >
          <Lamp :tone="summary.isAddingUp ? 'ac' : 'none'" still />
          {{ $t(`${KEY}.total`, { ...summary }) }}
          <span v-if="!summary.isAddingUp" class="text-muted">{{ $t(`${KEY}.totalOff`) }}</span>
        </p>
      </Card>
      <Card panel as="div" :title="$t(`${KEY}.judging`)">
        <CheckerSection
          v-model="form"
          part="main"
          :code="problem.code"
          :data="query.data.value"
          :errors="errors"
        />
        <div class="border-t border-line px-4 py-3">
          <Checkbox
            v-model="infoForm.partial"
            input-id="problem-partial"
            data-testid="problem-partial"
            :label="$t('admin.problems.general.limits.partial')"
            :description="$t('admin.problems.general.limits.partialHint')"
          />
        </div>
        <div class="border-t border-line px-4">
          <Disclosure v-model:open="isAdvancedOpen" :label="$t(`${KEY}.advanced`)">
            <CheckerSection
              v-model="form"
              part="advanced"
              :code="problem.code"
              :data="query.data.value"
              :errors="errors"
            />
          </Disclosure>
        </div>
      </Card>
    </div>
  </QueryState>
</template>
