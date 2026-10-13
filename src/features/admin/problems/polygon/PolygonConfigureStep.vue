<script setup lang="ts">
import { computed, ref } from 'vue';
import { startPolygonLinkImport } from '@/api/polygon.api';
import type { ImportOptions } from '@/api/types/problem-imports';
import type { PolygonImportBody, PolygonProblem } from '@/api/types/polygon';
import { usePermissions } from '@/stores/use-permissions';
import { SYNC_POLYGON } from '../../admin-screens';
import AdminStatus from '../../ui/AdminStatus.vue';
import { buttonClass } from '../../ui/controls';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import ImportCheckbox from '../import/ImportCheckbox.vue';
import ImportOptionsForm from '../import/ImportOptionsForm.vue';
import { IMPORT_FORM_FIELDS, codeFromPolygonName } from '../import/import-form';
import { importRefusalText } from '../import/import-refusal';
import PolygonSourcePanel from './PolygonSourcePanel.vue';

/** Step 2: the zip import's options for the checked link's problem, plus auto-sync; "Bắt đầu nhập" starts the job. */
const props = defineProps<{ link: string; problem: PolygonProblem }>();
const emit = defineEmits<{ back: []; started: [jobId: string, body: PolygonImportBody] }>();
const autoSync = ref(false);
/** Auto-sync runs with the importer's `judge.sync_polygon_problem`; an importer without it links with auto-sync off. */
const { canAny } = usePermissions();
const canAutoSync = computed(() => canAny(SYNC_POLYGON));
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
  <div class="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
    <div class="flex min-w-0 flex-col gap-4">
      <ImportOptionsForm
        :with-file="false"
        links-polygon
        :title="$t('admin.polygonLink.configure.board')"
        :initial="initial"
        :is-pending="isPending"
        :server-errors="fieldErrors"
        @start="start"
      >
        <template #extra>
          <ImportCheckbox
            v-if="canAutoSync"
            v-model="autoSync"
            :label="$t('admin.polygonLink.configure.autoSync')"
            :description="
              $t('admin.polygonLink.configure.autoSyncHint', { revision: problem.revision })
            "
          />
        </template>
        <template #actions>
          <button type="button" :class="buttonClass('ghost')" @click="emit('back')">
            {{ $t('admin.polygonLink.configure.back') }}
          </button>
        </template>
      </ImportOptionsForm>
      <AdminStatus v-if="refusal" kind="refused" :text="refusal" />
    </div>
    <PolygonSourcePanel :problem="problem" />
  </div>
</template>
