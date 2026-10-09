<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ApiError } from '@/api/client';
import { startPolygonImport } from '@/api/problem-imports.api';
import type { ImportOptions } from '@/api/types/problem-imports';
import { translate } from '@/i18n';
import AdminBit from '../../shell/AdminBit.vue';
import AdminPageHeader from '../../ui/AdminPageHeader.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import ImportOptionsForm from './ImportOptionsForm.vue';
import ImportProgress from './ImportProgress.vue';
import { IMPORT_FORM_FIELDS } from './import-form';
import { useImportJob } from './use-import-job';

interface ImportSubmission {
  options: ImportOptions;
  file: File;
}

const jobId = ref<string | null>(null);
const submittedCode = ref('');
const { job, phase, failure: pollFailure, stop } = useImportJob(jobId);

const { run, isPending, fieldErrors, failure } = useAdminMutation({
  mutate: ({ options, file }: ImportSubmission) => startPolygonImport(options, file),
  onDone: ({ jobId: startedId }, { options }) => {
    submittedCode.value = options.code;
    jobId.value = startedId;
  },
});

/** A 429 says the hourly limit and, when the server sent `Retry-After`, the wait. */
function refusalTextOf(error: ApiError): string {
  if (error.code !== 'rate_limited') return failureTextOf(error);
  const wait =
    error.retryAfterSeconds === null
      ? ''
      : ` ${translate('admin.ui.retryIn', { seconds: error.retryAfterSeconds })}`;
  return `${translate('admin.polygon.rateLimited')}${wait}`;
}

/** Field problems are shown under their fields; a refusal no form field explains (`quota_exceeded` on `storage`) gets the page line. */
const refusal = computed(() =>
  failure.value && !IMPORT_FORM_FIELDS.some((field) => field in fieldErrors.value)
    ? refusalTextOf(failure.value)
    : null,
);
</script>

<template>
  <div class="flex flex-col gap-5 px-4 py-6 sm:px-8">
    <AdminPageHeader
      :crumbs="[{ label: $t('admin.shell.groups.content') }]"
      :title="$t('admin.polygon.title')"
      :lead="$t('admin.polygon.lead')"
    />
    <div class="grid gap-5 lg:grid-cols-2">
      <ImportOptionsForm :is-pending="isPending" :server-errors="fieldErrors" @start="run" />
      <ImportProgress
        v-if="jobId"
        :code="submittedCode"
        :phase="phase"
        :job="job"
        :poll-failure="pollFailure"
        :stop="stop"
      />
    </div>
    <div v-if="refusal" class="flex items-start gap-3">
      <AdminStatus kind="refused" :text="refusal" />
      <AdminBit placement="refused" />
    </div>
  </div>
</template>
