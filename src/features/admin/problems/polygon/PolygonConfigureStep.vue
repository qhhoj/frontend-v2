<script setup lang="ts">
import { computed, ref } from 'vue';
import { startPolygonLinkImport } from '@/api/polygon.api';
import type { ImportOptions } from '@/api/types/problem-imports';
import type { PolygonImportBody, PolygonProblem } from '@/api/types/polygon';
import AdminBit from '../../shell/AdminBit.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import AdminSwitch from '../../ui/AdminSwitch.vue';
import { ADMIN_BUTTON_CLASS } from '../../ui/classes';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import ImportOptionsForm from '../import/ImportOptionsForm.vue';
import { IMPORT_FORM_FIELDS, codeFromPolygonName } from '../import/import-form';
import { importRefusalText } from '../import/import-refusal';
import PolygonSourcePanel from './PolygonSourcePanel.vue';

/** Step 2: the zip import's options for the checked link's problem, plus auto-sync; "Bắt đầu nhập" starts the job. */
const props = defineProps<{ link: string; problem: PolygonProblem }>();
const emit = defineEmits<{ back: []; started: [jobId: string, body: PolygonImportBody] }>();
const autoSync = ref(false);
const initial = { code: codeFromPolygonName(props.problem.name) };

const { run, isPending, fieldErrors, failure } = useAdminMutation({
  mutate: (body: PolygonImportBody) => startPolygonLinkImport(body),
  onDone: ({ jobId }, body) => emit('started', jobId, body),
});

function start({ options }: { options: ImportOptions }) {
  const body: PolygonImportBody = {
    ...options,
    link: props.link,
    mode: options.mode ?? 'create',
    ignoreZeroPointBatches: options.ignoreZeroPointBatches ?? false,
    ignoreZeroPointCases: options.ignoreZeroPointCases ?? false,
    appendMainSolution: options.appendMainSolution ?? false,
    autoSync: autoSync.value,
  };
  void run(body);
}

/** Field problems show under their fields (`code_taken` on `code`); the rest (`polygon_already_linked`, 429) get the line. */
const refusal = computed(() =>
  failure.value && !IMPORT_FORM_FIELDS.some((field) => field in fieldErrors.value)
    ? importRefusalText(failure.value)
    : null,
);
</script>

<template>
  <div class="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
    <div class="flex min-w-0 flex-col gap-4">
      <ImportOptionsForm
        :with-file="false"
        :title="$t('admin.polygonLink.configure.board')"
        :initial="initial"
        :is-pending="isPending"
        :server-errors="fieldErrors"
        @start="start"
      >
        <template #extra>
          <div class="rounded-row bg-surface-strong p-4">
            <AdminSwitch
              v-model="autoSync"
              :label="$t('admin.polygonLink.configure.autoSync')"
              :description="
                $t('admin.polygonLink.configure.autoSyncHint', { revision: problem.revision })
              "
            />
          </div>
        </template>
        <template #actions>
          <button type="button" :class="ADMIN_BUTTON_CLASS" @click="emit('back')">
            {{ $t('admin.polygonLink.configure.back') }}
          </button>
        </template>
      </ImportOptionsForm>
      <div v-if="refusal" class="flex items-start gap-3">
        <AdminStatus kind="refused" :text="refusal" />
        <AdminBit placement="refused" />
      </div>
    </div>
    <PolygonSourcePanel :problem="problem" />
  </div>
</template>
