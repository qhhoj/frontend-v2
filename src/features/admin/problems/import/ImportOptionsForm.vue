<script setup lang="ts">
import { problemTypeLabel } from '@/features/problems/problem-type-label';
import { FileArchive } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import type { ImportOptions } from '@/api/types/problem-imports';
import { formatFileSize } from '@/lib/format';
import { translate } from '@/i18n';
import { usePermissions } from '@/stores/use-permissions';
import { useProblemEditingMetaQuery } from '../problem-editing.queries';
import ProblemCodeField from '../general/ProblemCodeField.vue';
import CreationOwnerPicker from '../../creation/CreationOwnerPicker.vue';
import { useCreationScope } from '../../creation/creation-scope';
import { SYNC_POLYGON } from '../../admin-screens';
import AdminField from '../../ui/AdminField.vue';
import AdminCheckChips from '../../ui/AdminCheckChips.vue';
import UploadButton from '../../ui/UploadButton.vue';
import UsernameChips from '../../ui/UsernameChips.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import { CARD, INPUT, buttonClass } from '../../ui/controls';
import { needsPermissionText } from '../../ui/permission-text';
import { UPLOAD_LIMITS, tooLargeFor } from '../../ui/upload-limits';
import ImportCheckbox from './ImportCheckbox.vue';
import {
  IMPORT_MODES,
  IMPORT_MODE_PERMISSION,
  canCreateFor,
  missingForMode,
  emptyImportForm,
  importFormErrors,
  toImportOptions,
} from './import-form';
import type { ImportForm, ImportMode } from './import-form';

/**
 * The import options of both imports. The zip import (`withFile`) adds the package drop zone; an import from Polygon has
 * none, starts from `initial` (the code from the Polygon name) and adds its own switch (`extra` slot) and back button
 * (`actions` slot).
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
  }>(),
  { withFile: true, title: undefined, initial: undefined, linksPolygon: false },
);
const emit = defineEmits<{ start: [submission: { options: ImportOptions; file: File | null }] }>();

const form = ref<ImportForm>({ ...emptyImportForm(), ...props.initial });
const localErrors = ref<FieldErrors>({});
const { data: meta } = useProblemEditingMetaQuery();
const groups = computed(() => meta.value?.groups ?? []);
const typeOptions = computed(() =>
  (meta.value?.types ?? []).map((type) => ({ value: type.id, label: problemTypeLabel(type) })),
);
const errorOf = (field: string) => localErrors.value[field] ?? props.serverErrors[field];
const isOwnerReady = ref(false);
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
  emit('start', { options: toImportOptions(form.value), file: form.value.file });
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
        kind="problem"
      />

      <div class="grid gap-5 @lg:grid-cols-2">
        <ProblemCodeField
          v-model="form.code"
          input-id="import-code"
          :hint="$t('admin.polygon.form.codeInvalid')"
          :prefix="codePrefix"
          :error="errorOf('code')"
        />

        <fieldset class="flex flex-col gap-2">
          <legend class="mb-1.5 text-sm font-semibold">
            {{ $t('admin.polygon.form.mode.label') }}
          </legend>
          <label
            v-for="mode in IMPORT_MODES"
            :key="mode"
            class="flex min-h-9 flex-wrap items-center gap-2 pointer-coarse:min-h-11"
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

        <AdminField
          v-slot="{ id, describedBy }"
          :label="$t('admin.polygon.form.group')"
          :error="errorOf('groupId')"
        >
          <select :id="id" v-model="form.groupId" :class="INPUT" :aria-describedby="describedBy">
            <option value="">{{ $t('admin.polygon.form.groupDefault') }}</option>
            <option v-for="group in groups" :key="group.id" :value="group.id">
              {{ group.fullName }}
            </option>
          </select>
        </AdminField>

        <AdminField
          v-slot="{ id, describedBy, invalid }"
          :label="$t('admin.polygon.form.points')"
          :hint="$t('admin.polygon.form.pointsHint')"
          :error="errorOf('points')"
        >
          <input
            :id="id"
            v-model="form.points"
            type="number"
            inputmode="numeric"
            min="800"
            max="3500"
            :class="INPUT"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
          />
        </AdminField>

        <fieldset class="flex flex-col gap-2 @lg:col-span-2">
          <legend class="mb-1.5 text-sm font-semibold">{{ $t('admin.polygon.form.types') }}</legend>
          <p v-if="errorOf('typeIds')" class="text-sm text-negative">{{ errorOf('typeIds') }}</p>
          <AdminCheckChips v-model="form.typeIds" :options="typeOptions" name="import-types" />
        </fieldset>

        <UsernameChips
          v-model="form.authors"
          :label="$t('admin.polygon.form.authors')"
          :error="errorOf('authors')"
        />
        <UsernameChips
          v-model="form.curators"
          :label="$t('admin.polygon.form.curators')"
          :error="errorOf('curators')"
        />

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

      <div class="grid gap-3 border-t border-line pt-4 @lg:grid-cols-2">
        <ImportCheckbox
          v-model="form.ignoreZeroPointBatches"
          :label="$t('admin.polygon.form.ignoreBatches')"
        />
        <ImportCheckbox
          v-model="form.ignoreZeroPointCases"
          :label="$t('admin.polygon.form.ignoreCases')"
        />
        <ImportCheckbox
          v-model="form.appendMainSolution"
          :label="$t('admin.polygon.form.appendSolution')"
        />
        <slot name="extra" />
      </div>

      <div class="flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <slot name="actions" />
        <p
          v-if="withFile && !form.file"
          id="import-submit-reason"
          class="ml-auto text-sm text-muted"
        >
          {{ $t('admin.polygon.form.submitNeedsFile') }}
        </p>
        <button
          type="submit"
          :class="[buttonClass('primary'), !(withFile && !form.file) && 'ml-auto']"
          :aria-disabled="isSubmitBlocked || undefined"
          :aria-describedby="withFile && !form.file ? 'import-submit-reason' : undefined"
        >
          {{ $t('admin.polygon.form.submit') }}
        </button>
      </div>
    </form>
  </section>
</template>
