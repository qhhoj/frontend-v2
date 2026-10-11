<script setup lang="ts">
import { computed, ref } from 'vue';
import { startZipImport } from '@/api/problem-imports.api';
import type { ImportOptions } from '@/api/types/problem-imports';
import { usePermissions } from '@/stores/use-permissions';
import { ADMIN_SCREENS } from '../../admin-screens';
import { buttonClass } from '../../ui/controls';
import AdminPageHeader from '../../ui/AdminPageHeader.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import ImportOptionsForm from './ImportOptionsForm.vue';
import ImportProgress from './ImportProgress.vue';
import { IMPORT_FORM_FIELDS } from './import-form';
import { importRefusalText } from './import-refusal';
import { useImportJob } from './use-import-job';

interface ImportSubmission {
  options: ImportOptions;
  file: File | null;
}

const { canAny } = usePermissions();
const jobId = ref<string | null>(null);
const submittedCode = ref('');
const { job, phase, failure: pollFailure, stop } = useImportJob(jobId);

const { run, isPending, fieldErrors, failure } = useAdminMutation({
  /** The form emits only with a file (`withFile`); the guard keeps the type honest. */
  mutate: ({ options, file }: ImportSubmission) =>
    file ? startZipImport(options, file) : Promise.reject(new Error('No package file')),
  onDone: ({ jobId: startedId }, { options }) => {
    submittedCode.value = options.code;
    jobId.value = startedId;
  },
});

/** Field problems are shown under their fields; a refusal no form field explains (`quota_exceeded` on `storage`) gets the page line. */
const refusal = computed(() =>
  failure.value && !IMPORT_FORM_FIELDS.some((field) => field in fieldErrors.value)
    ? importRefusalText(failure.value)
    : null,
);
</script>

<template>
  <div class="flex flex-col gap-4">
    <AdminPageHeader :title="$t('admin.polygon.title')" :lead="$t('admin.polygon.lead')">
      <template #actions>
        <RouterLink
          v-if="canAny(ADMIN_SCREENS.polygonImport.permission)"
          :to="{ name: 'admin-polygonImport' }"
          :class="buttonClass('secondary')"
          >{{ $t('admin.polygonLink.wizard.fromPolygon') }}</RouterLink
        >
      </template>
    </AdminPageHeader>
    <ImportProgress
      v-if="jobId"
      :code="submittedCode"
      :phase="phase"
      :job="job"
      :poll-failure="pollFailure"
      :stop="stop"
    />
    <AdminStatus v-if="refusal" kind="refused" :text="refusal" />
    <ImportOptionsForm :is-pending="isPending" :server-errors="fieldErrors" @start="run" />
  </div>
</template>
