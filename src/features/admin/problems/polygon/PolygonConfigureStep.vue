<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { startPolygonLinkImport } from '@/api/polygon.api';
import type { ImportOptions } from '@/api/types/problem-imports';
import type { PolygonImportBody, PolygonProblem } from '@/api/types/polygon';
import { translate } from '@/i18n';
import { usePermissions } from '@/stores/use-permissions';
import { SYNC_POLYGON } from '../../admin-screens';
import AdminStatus from '../../ui/AdminStatus.vue';
import { buttonClass } from '../../ui/controls';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import ImportCheckbox from '../import/ImportCheckbox.vue';
import ImportOptionsForm from '../import/ImportOptionsForm.vue';
import { IMPORT_FORM_FIELDS, codeFromPolygonName, emptyImportForm } from '../import/import-form';
import type { ImportForm } from '../import/import-form';
import { importRefusalText } from '../import/import-refusal';
import PolygonLanguageFields from './PolygonLanguageFields.vue';
import PolygonOverwriteConfirm from './PolygonOverwriteConfirm.vue';
import PolygonSourcePanel from './PolygonSourcePanel.vue';
import PolygonUpdateTarget from './PolygonUpdateTarget.vue';
import {
  defaultLanguageChoice,
  isLanguageFieldDrawn,
  repeatedLanguageErrors,
  repeatedLanguages,
  toLanguageOptions,
} from './polygon-languages';
import { optionsRefusalOf } from './polygon-options-refusal';
import { packageRevisionOf } from './polygon-preview';
import type { ConfigureDraft } from './polygon-wizard';

/**
 * Step 2 (configure option A): the import's target, the package's statement languages (selects fed by the preview),
 * judging and sync, then the QHHOJ catalog folded. "Bắt đầu nhập" starts the job; an update first confirms what the
 * package overwrites.
 */
const props = defineProps<{
  link: string;
  problem: PolygonProblem;
  /** The form as it was sent, when "Sửa thiết lập" comes back to it. */
  draft: ConfigureDraft | null;
}>();
const emit = defineEmits<{
  back: [];
  started: [jobId: string, body: PolygonImportBody, draft: ConfigureDraft];
}>();
const autoSync = ref(props.draft?.autoSync ?? false);
/** Auto-sync runs with the importer's `judge.sync_polygon_problem`; an importer without it links with auto-sync off. */
const { canAny } = usePermissions();
const canAutoSync = computed(() => canAny(SYNC_POLYGON));
const initial = props.draft?.form ?? { code: codeFromPolygonName(props.problem.name) };
const statements = props.problem.statements;
const languages = ref(props.draft?.languages ?? defaultLanguageChoice(statements));
/** The form of the start in flight, handed to the progress step with its job. */
const sentForm = ref<ImportForm | null>(null);
/** The update body waiting for the overwrite confirmation. */
const pending = ref<PolygonImportBody | null>(null);
const isConfirmOpen = computed({
  get: () => pending.value !== null,
  set: (open) => void (open || (pending.value = null)),
});

const { run, isPending, fieldErrors, failure, reset } = useAdminMutation({
  mutate: (body: PolygonImportBody) => startPolygonLinkImport(body),
  onDone: ({ jobId }, body) => {
    const form = sentForm.value ?? { ...emptyImportForm(), ...initial };
    emit('started', jobId, body, { form, languages: languages.value, autoSync: autoSync.value });
  },
});
const optionsRefusal = computed(() => optionsRefusalOf(failure.value));
/** A language refusal is about the choice as sent: a new choice clears it. */
watch(languages, () => void (optionsRefusal.value && reset()));

/** Two translations into one site language are refused by the server; said under the second one before it is asked. */
const languageErrors = computed(() => {
  const errors = repeatedLanguageErrors(languages.value);
  const server = optionsRefusal.value;
  if (server?.field) errors[server.field] ??= server.text;
  return errors;
});

const bodyOf = (options: ImportOptions): PolygonImportBody => ({
  ...options,
  ...toLanguageOptions(statements, languages.value),
  link: props.link,
  mode: options.mode ?? 'create',
  ignoreZeroPointBatches: options.ignoreZeroPointBatches ?? false,
  ignoreZeroPointCases: options.ignoreZeroPointCases ?? false,
  appendMainSolution: options.appendMainSolution ?? false,
  importTutorial: options.importTutorial ?? true,
  autoSync: autoSync.value,
});

function start({ options, form }: { options: ImportOptions; form: ImportForm }) {
  if (repeatedLanguages(languages.value).length > 0) return;
  sentForm.value = form;
  const body = bodyOf(options);
  if (body.mode === 'update') pending.value = body;
  else void run(body);
}

/** A refused update closes the dialog: the refusal shows beside its field or on the page line. */
async function confirmUpdate() {
  if (!pending.value) return;
  await run(pending.value);
  pending.value = null;
}

const submitLabelOf = (form: ImportForm) =>
  form.mode === 'update' && form.code
    ? translate('admin.polygonLink.configure.update.submit', { code: form.code })
    : translate('admin.polygon.form.submit');

/**
 * Field problems show under their fields (`code_taken` on `code`, a language under its select); the rest get the line,
 * and so does a language refusal whose select is not on screen (one statement, one tutorial or none).
 */
const refusal = computed(() => {
  if (!failure.value || IMPORT_FORM_FIELDS.some((field) => field in fieldErrors.value)) return null;
  const options = optionsRefusal.value;
  if (!options) return importRefusalText(failure.value);
  const isDrawn = options.field && isLanguageFieldDrawn(options.field, statements, languages.value);
  return isDrawn ? null : options.text;
});
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
        :submit-label-of="submitLabelOf"
        @start="start"
      >
        <template #target="{ mode, code }">
          <PolygonUpdateTarget v-if="mode === 'update'" :code="code" />
        </template>
        <template #languages>
          <PolygonLanguageFields
            v-model="languages"
            :statements="statements"
            :errors="languageErrors"
          />
        </template>
        <template #extra>
          <ImportCheckbox
            v-if="canAutoSync"
            v-model="autoSync"
            :label="$t('admin.polygonLink.configure.autoSync')"
            :description="
              $t('admin.polygonLink.configure.autoSyncHint', {
                revision: packageRevisionOf(problem),
              })
            "
            :help="$t('admin.polygonLink.configure.autoSyncMore')"
            :help-label="$t('admin.polygonLink.configure.autoSyncMoreLabel')"
          />
        </template>
        <template #before-actions>
          <PolygonSourcePanel :problem="problem" class="xl:hidden" />
        </template>
        <template #actions>
          <button type="button" :class="buttonClass('ghost')" @click="emit('back')">
            {{ $t('admin.polygonLink.configure.back') }}
          </button>
        </template>
      </ImportOptionsForm>
      <AdminStatus v-if="refusal" kind="refused" :text="refusal" />
    </div>
    <div class="hidden xl:sticky xl:top-4 xl:block">
      <PolygonSourcePanel :problem="problem" />
    </div>
    <PolygonOverwriteConfirm
      v-if="pending"
      v-model:visible="isConfirmOpen"
      :code="pending.code"
      :problem="problem"
      :busy="isPending"
      @confirm="confirmUpdate"
    />
  </div>
</template>
