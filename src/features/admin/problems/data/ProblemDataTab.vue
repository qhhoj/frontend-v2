<script setup lang="ts">
import { computed } from 'vue';
import { uploadDataArchive } from '@/api/problem-data.api';
import type { EditableProblem, ProblemEditingMeta } from '@/api/types/problem-editing';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { translate } from '@/i18n';
import { usePermissions } from '@/stores/use-permissions';
import AdminStatus from '../../ui/AdminStatus.vue';
import { CARD } from '../../ui/controls';
import AdminLeaveGuard from '../../ui/form/AdminLeaveGuard.vue';
import AdminSaveBar from '../../ui/form/AdminSaveBar.vue';
import UploadButton from '../../ui/UploadButton.vue';
import { UPLOAD_LIMITS } from '../../ui/upload-limits';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { failureReasonOf } from '../failure-reason';
import ProblemPackageCard from '../package/ProblemPackageCard.vue';
import PolygonLinkPanel from '../polygon/PolygonLinkPanel.vue';
import CasesEditor from './CasesEditor.vue';
import CheckerSection from './CheckerSection.vue';
import DataArchiveCard from './DataArchiveCard.vue';
import DataFeedback from './DataFeedback.vue';
import DataSourceFiles from './DataSourceFiles.vue';
import { useKeepDataAnswer } from './problem-data.queries';
import { useDataForm } from './use-data-form';

/**
 * Polygon link (when linked), the checker's complaints, then three cards: the archive and full package, the source files,
 * and the judging form (checker/grader and the test list) with its save bar.
 */
const props = defineProps<{ problem: EditableProblem; meta: ProblemEditingMeta }>();
const { can } = usePermissions();
const {
  query,
  form,
  errors,
  dirtyCount,
  savedAt,
  badRowNumbers,
  markInvalid,
  save,
  discard,
  mutation,
} = useDataForm(() => props.problem.code);
const keepAnswer = useKeepDataAnswer(() => props.problem.code);
const archive = useAdminMutation({
  mutate: (file: File) => uploadDataArchive(props.problem.code, file),
  onDone: keepAnswer,
});
const blockedReason = computed(() =>
  badRowNumbers.value.length > 0
    ? translate('admin.problems.data.cases.badJsonRows', { rows: badRowNumbers.value.join(', ') })
    : undefined,
);
const FORM_ID = 'problem-data-form';
</script>

<template>
  <PolygonLinkPanel v-if="can('judge.import_polygon_package')" :code="problem.code" />
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
      <div class="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] xl:items-start">
        <div :class="CARD">
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
            </template>
          </DataArchiveCard>
          <div v-if="archive.failure.value" class="px-4 pb-4 sm:px-5">
            <AdminStatus kind="refused" :text="failureReasonOf(archive.failure.value)" />
          </div>
          <ProblemPackageCard :code="problem.code" />
        </div>
        <DataSourceFiles :code="problem.code" :data="query.data.value" />
      </div>
      <form :id="FORM_ID" novalidate @submit.prevent="save">
        <fieldset
          :disabled="mutation.isPending.value"
          :class="[CARD, 'm-0 flex min-w-0 flex-col p-0']"
        >
          <CheckerSection
            v-model="form"
            :code="problem.code"
            :data="query.data.value"
            :errors="errors"
          />
          <CasesEditor
            v-model="form.cases"
            :data="query.data.value"
            :errors="errors"
            :problem-points="problem.points"
            @invalid="markInvalid"
          />
        </fieldset>
      </form>
      <AdminStatus
        v-if="mutation.failure.value"
        kind="refused"
        :text="failureReasonOf(mutation.failure.value)"
      />
      <AdminSaveBar
        data-testid="data-save-bar"
        :form="FORM_ID"
        :dirty-count="dirtyCount"
        :pending="mutation.isPending.value"
        :saved-at="savedAt"
        :blocked-reason="blockedReason"
        :save-label="$t('admin.problems.data.save')"
        @discard="discard"
      />
    </div>
  </QueryState>
  <AdminLeaveGuard :dirty-count="dirtyCount" />
</template>
