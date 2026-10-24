<script setup lang="ts">
import { ChevronRight, FileArchive } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import type { ImportOptions } from '@/api/types/problem-imports';
import { formatFileSize } from '@/lib/format';
import { translate } from '@/i18n';
import { usePermissions } from '@/stores/use-permissions';
import ProblemCodeField from '../general/ProblemCodeField.vue';
import CreationOwnerPicker from '../../creation/CreationOwnerPicker.vue';
import { useCreationScope } from '../../creation/creation-scope';
import { SYNC_POLYGON } from '../../admin-screens';
import AdminField from '../../ui/AdminField.vue';
import UploadButton from '../../ui/UploadButton.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import { CARD, INPUT, buttonClass } from '../../ui/controls';
import { needsPermissionText } from '../../ui/permission-text';
import { UPLOAD_LIMITS, tooLargeFor } from '../../ui/upload-limits';
import ImportCatalogFields from './ImportCatalogFields.vue';
import ImportCheckbox from './ImportCheckbox.vue';
import {
  IMPORT_MODES,
  POINTS_MIN,
  IMPORT_MODE_PERMISSION,
  canCreateFor,
  missingForMode,
  emptyImportForm,
  importFormErrors,
  toImportOptions,
} from './import-form';
import type { ImportForm, ImportMode } from './import-form';

/**
 * The import options of both imports. The zip import (`withFile`) adds the package drop zone and types the statement
 * languages. An import from Polygon (`linksPolygon`, configure option A) has no file, starts from `initial` (the code from
 * the Polygon name), puts its own language selects (`languages` slot) and options (`extra` slot) before the QHHOJ catalog
 * fields, which it folds ("sửa được sau"), and adds the update target (`target` slot), its source card on phones
 * (`before-actions` slot) and its back button (`actions` slot).
 */
const props = withDefaults(
  defineProps<{
    isPending: boolean;
    serverErrors: FieldErrors;
    withFile?: boolean;
    title?: string;
    initial?: Partial<ImportForm>;
    /** An import from a Polygon link: its update replaces the problem's link. */
    linksPolygon?: boolean;
    /** The submit button's text for the form as it stands; "Bắt đầu nhập" when absent. */
    submitLabelOf?: (form: ImportForm) => string;
  }>(),
  {
    withFile: true,
    title: undefined,
    initial: undefined,
    linksPolygon: false,
    submitLabelOf: undefined,
  },
);
/** `form` is the form as submitted (a copy), for a caller that refills it later. */
const emit = defineEmits<{
  start: [submission: { options: ImportOptions; file: File | null; form: ImportForm }];
  /** The "import the tutorial" box as it stands, for a caller that words its text by it. */
  tutorialChange: [isImported: boolean];
}>();

const form = ref<ImportForm>({ ...emptyImportForm(), ...props.initial });
watch(
  () => form.value.importTutorial,
  (isImported) => emit('tutorialChange', isImported),
  {
    immediate: true,
  },
);
const localErrors = ref<FieldErrors>({});
const errorOf = (field: string) => localErrors.value[field] ?? props.serverErrors[field];
const isOwnerReady = ref(false);
const isOwnerBlocked = ref(false);
const isCreate = computed(() => form.value.mode === 'create');
const { scope } = useCreationScope('problem');
const { canAny } = usePermissions();
const rights = computed(() => ({
  canEditOwn: canAny(IMPORT_MODE_PERMISSION.update),
  canRelink: !props.linksPolygon || canAny(SYNC_POLYGON),
  scope: scope.value,
}));
const missingFor = (mode: ImportMode) => missingForMode(mode, rights.value);
const canUseMode = (mode: ImportMode) => missingFor(mode) === null;
/** The submit also checks the owner picked. */
const missingOnSubmit = (mode: ImportMode) =>
  mode === 'create' && !canCreateFor(form.value.owner, scope.value)
    ? IMPORT_MODE_PERMISSION.create
    : missingFor(mode);
/** A create waits for the owner picker; without any create right the mode check refuses instead. */
const isWaitingForOwner = computed(
  () => isCreate.value && canUseMode('create') && !isOwnerReady.value,
);
/** The message key of why the submit does nothing, shown beside it: no place to create (a file cannot fix that), else no file. */
const submitReason = computed(() => {
  if (isWaitingForOwner.value && isOwnerBlocked.value) return 'admin.creation.owner.blocked';
  return props.withFile && !form.value.file ? 'admin.polygon.form.submitNeedsFile' : null;
});
const isSubmitBlocked = computed(
  () => props.isPending || (props.withFile && !form.value.file) || isWaitingForOwner.value,
);
const codePrefix = computed(() =>
  isCreate.value ? (form.value.owner?.problemCodePrefix ?? '') : '',
);
/** A viewer who may only update starts on update, so the default never refuses itself. */
if (!canUseMode('create') && canUseMode('update')) form.value.mode = 'update';

function chooseFile(file: File) {
  localErrors.value = {};
  if (!file.name.toLowerCase().endsWith('.zip')) {
    localErrors.value = { file: translate('admin.polygon.form.notZip') };
    return;
  }
  if (tooLargeFor(file, UPLOAD_LIMITS.archive)) {
    localErrors.value = {
      file: translate('admin.ui.tooLarge', { max: formatFileSize(UPLOAD_LIMITS.archive) }),
    };
    return;
  }
  form.value.file = file;
}

function onDrop(event: DragEvent) {
  const file = event.dataTransfer?.files[0];
  if (file) chooseFile(file);
}

function submit() {
  if (props.isPending || isWaitingForOwner.value) return;
  localErrors.value = importFormErrors(form.value, missingOnSubmit, { needsFile: props.withFile });
  if (Object.keys(localErrors.value).length > 0) return;
  const submitted = { ...form.value };
  emit('start', { options: toImportOptions(submitted), file: submitted.file, form: submitted });
}
</script>

<template>
  <section :class="[CARD, 'flex flex-col gap-4 p-4 md:p-5']">
    <h2 class="font-display text-base font-semibold">
      {{ title ?? $t('admin.polygon.form.board') }}
    </h2>

    <form class="@container flex flex-col gap-5" @submit.prevent="submit">
      <div
        v-if="withFile"
        data-testid="polygon-file"
        class="flex flex-col items-center gap-2 rounded-row border-2 border-dashed border-line-strong bg-surface-strong px-4 py-6 text-center"
        :class="errorOf('file') && 'border-negative'"
        @dragover.prevent
        @drop.prevent="onDrop"
      >
        <FileArchive aria-hidden="true" class="size-6 text-muted" :stroke-width="1.75" />
        <p class="font-semibold">{{ $t('admin.polygon.form.drop') }}</p>
        <p v-if="form.file" class="font-mono text-sm">
          {{
            $t('admin.polygon.form.pickedFile', {
              name: form.file.name,
              size: formatFileSize(form.file.size),
            })
          }}
        </p>
        <UploadButton
          :label="$t('admin.polygon.form.chooseFile')"
          accept=".zip"
          :max-bytes="UPLOAD_LIMITS.archive"
          :is-pending="isPending"
          @picked="chooseFile"
        />
        <p v-if="errorOf('file')" role="alert" class="text-sm text-negative">
          {{ errorOf('file') }}
        </p>
      </div>

      <CreationOwnerPicker
        v-if="isCreate && canUseMode('create')"
        v-model="form.owner"
        v-model:ready="isOwnerReady"
        v-model:blocked="isOwnerBlocked"
        kind="problem"
      />

      <div class="grid gap-5 @lg:grid-cols-2">
        <fieldset class="flex flex-col gap-2">
          <legend class="mb-1.5 text-sm font-semibold">
            {{ $t('admin.polygon.form.mode.label') }}
          </legend>
          <label
            v-for="mode in IMPORT_MODES"
            :key="mode"
            class="flex min-h-9 flex-wrap items-center gap-2 touch:min-h-11"
          >
            <input
              v-model="form.mode"
              type="radio"
              name="import-mode"
              class="size-4 accent-[var(--qh-accent)]"
              :value="mode"
              :disabled="!canUseMode(mode)"
            />
            {{ $t(`admin.polygon.form.mode.${mode}`) }}
            <span v-if="!canUseMode(mode)" class="basis-full pl-6 text-sm text-muted">
              {{ needsPermissionText(missingFor(mode) ?? '') }}
            </span>
          </label>
          <p v-if="errorOf('mode')" class="text-sm text-negative">{{ errorOf('mode') }}</p>
        </fieldset>

        <ProblemCodeField
          v-model="form.code"
          input-id="import-code"
          :label="linksPolygon && !isCreate ? $t('admin.polygon.form.codeUpdate') : undefined"
          :hint="$t('admin.polygon.form.codeInvalid')"
          :prefix="codePrefix"
          :error="errorOf('code')"
        />
      </div>

      <slot name="target" :mode="form.mode" :code="form.code" />

      <ImportCatalogFields v-if="!linksPolygon" v-model:form="form" :error-of="errorOf" />

      <slot name="languages" :import-tutorial="form.importTutorial">
        <div class="grid gap-5 @lg:grid-cols-2">
          <AdminField
            v-slot="{ id, describedBy }"
            :label="$t('admin.polygon.form.mainLanguage')"
            :hint="$t('admin.polygon.form.mainLanguageHint')"
            :error="errorOf('mainStatementLanguage')"
          >
            <input
              :id="id"
              v-model="form.mainStatementLanguage"
              :class="INPUT"
              autocomplete="off"
              :aria-describedby="describedBy"
            />
          </AdminField>

          <AdminField
            v-if="form.importTutorial !== false"
            v-slot="{ id }"
            :label="$t('admin.polygon.form.solutionLanguage')"
            :error="errorOf('tutorialLanguage')"
          >
            <input :id="id" v-model="form.tutorialLanguage" :class="INPUT" autocomplete="off" />
          </AdminField>

          <AdminField
            v-slot="{ id, describedBy, invalid }"
            class="@lg:col-span-2"
            :label="$t('admin.polygon.form.languageMap')"
            :hint="$t('admin.polygon.form.languageMapHint')"
            :error="errorOf('statementLanguages')"
          >
            <textarea
              :id="id"
              v-model="form.languageMapText"
              rows="3"
              :class="[INPUT, 'py-2']"
              :aria-describedby="describedBy"
              :aria-invalid="invalid ? 'true' : undefined"
            />
          </AdminField>
        </div>
      </slot>

      <div class="flex flex-col gap-3 border-t border-line pt-4">
        <h3 v-if="linksPolygon" class="font-display font-semibold">
          {{ $t('admin.polygonLink.configure.judging') }}
        </h3>
        <div class="grid gap-3 @lg:grid-cols-2">
          <ImportCheckbox
            v-model="form.ignoreZeroPointBatches"
            :label="$t('admin.polygon.form.ignoreBatches')"
            :description="$t('admin.polygon.form.ignoreBatchesHint')"
          />
          <ImportCheckbox
            v-model="form.ignoreZeroPointCases"
            :label="$t('admin.polygon.form.ignoreCases')"
            :description="$t('admin.polygon.form.ignoreCasesHint')"
          />
          <ImportCheckbox
            v-model="form.importTutorial"
            :label="$t('admin.polygon.form.importTutorial')"
            :description="$t('admin.polygon.form.importTutorialHint')"
          />
          <ImportCheckbox
            v-model="form.appendMainSolution"
            :label="$t('admin.polygon.form.appendSolution')"
            :description="$t('admin.polygon.form.appendSolutionHint')"
          />
          <slot name="extra" />
        </div>
      </div>

      <details
        v-if="linksPolygon"
        class="group border-t border-line pt-2"
        data-testid="import-catalog-fold"
      >
        <summary
          class="flex min-h-11 cursor-pointer flex-wrap items-center gap-x-2 font-display font-semibold"
        >
          <ChevronRight
            aria-hidden="true"
            class="size-4 text-muted transition-transform group-open:rotate-90"
            :stroke-width="1.75"
          />
          {{ $t('admin.polygon.form.catalog') }}
          <span class="font-sans text-meta font-normal text-muted">{{
            isCreate
              ? $t('admin.polygon.form.catalogCreate', { points: POINTS_MIN })
              : $t('admin.polygon.form.catalogUpdate')
          }}</span>
        </summary>
        <ImportCatalogFields v-model:form="form" :error-of="errorOf" class="pt-3 pb-1" />
      </details>

      <slot name="before-actions" />

      <div class="flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <slot name="actions" />
        <p
          v-if="submitReason"
          id="import-submit-reason"
          class="min-w-0 flex-1 basis-56 text-sm text-muted @lg:text-right"
        >
          {{ $t(submitReason) }}
        </p>
        <button
          type="submit"
          :class="[buttonClass('primary'), !submitReason && 'ml-auto']"
          :aria-disabled="isSubmitBlocked || undefined"
          :aria-describedby="submitReason ? 'import-submit-reason' : undefined"
        >
          {{ submitLabelOf ? submitLabelOf(form) : $t('admin.polygon.form.submit') }}
        </button>
      </div>
    </form>
  </section>
</template>
