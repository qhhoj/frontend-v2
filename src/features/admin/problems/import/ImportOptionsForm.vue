<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ImportOptions } from '@/api/types/problem-imports';
import { formatFileSize } from '@/lib/format';
import { translate } from '@/i18n';
import { usePermissions } from '@/stores/use-permissions';
import { useProblemEditingMetaQuery } from '../problem-editing.queries';
import AdminField from '../../ui/AdminField.vue';
import AdminSwitch from '../../ui/AdminSwitch.vue';
import UploadButton from '../../ui/UploadButton.vue';
import UsernameChips from '../../ui/UsernameChips.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import { ADMIN_INPUT_CLASS, ADMIN_PRIMARY_CLASS } from '../../ui/classes';
import { UPLOAD_LIMITS, tooLargeFor } from '../../ui/upload-limits';
import {
  IMPORT_MODES,
  IMPORT_MODE_PERMISSION,
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
  }>(),
  { withFile: true, title: undefined, initial: undefined },
);
const emit = defineEmits<{ start: [submission: { options: ImportOptions; file: File | null }] }>();

const form = ref<ImportForm>({ ...emptyImportForm(), ...props.initial });
const localErrors = ref<FieldErrors>({});
const { data: meta } = useProblemEditingMetaQuery();
const groups = computed(() => meta.value?.groups ?? []);
const types = computed(() => meta.value?.types ?? []);
const errorOf = (field: string) => localErrors.value[field] ?? props.serverErrors[field];
const isSubmitBlocked = computed(() => props.isPending || (props.withFile && !form.value.file));
const { canAny } = usePermissions();
const canUseMode = (mode: ImportMode) => canAny(IMPORT_MODE_PERMISSION[mode]);
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
  if (props.isPending) return;
  localErrors.value = importFormErrors(form.value, canUseMode, { needsFile: props.withFile });
  if (Object.keys(localErrors.value).length > 0) return;
  emit('start', { options: toImportOptions(form.value), file: form.value.file });
}
</script>

<template>
  <section class="glass flex flex-col gap-5 rounded-panel p-5">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-base font-bold">{{ title ?? $t('admin.polygon.form.board') }}</h2>
      <span
        v-if="withFile"
        class="rounded-pill border border-line-strong px-2.5 py-1 font-mono text-xs text-muted"
      >
        {{
          $t('admin.polygon.form.permissionChip', { permission: 'judge.import_polygon_package' })
        }}
      </span>
    </div>

    <form class="@container flex flex-col gap-5" @submit.prevent="submit">
      <div
        v-if="withFile"
        data-testid="polygon-file"
        class="flex flex-col gap-3 rounded-panel border border-dashed border-line-strong p-4"
        @dragover.prevent
        @drop.prevent="onDrop"
      >
        <p class="font-semibold">{{ $t('admin.polygon.form.drop') }}</p>
        <p v-if="form.file" class="text-sm text-muted">
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
        <p v-if="errorOf('file')" class="text-sm text-negative">{{ errorOf('file') }}</p>
      </div>

      <div class="grid gap-5 @lg:grid-cols-2">
        <AdminField
          v-slot="{ id, describedBy, invalid }"
          :label="$t('admin.polygon.form.code')"
          :error="errorOf('code')"
          input-id="import-code"
        >
          <input
            :id="id"
            v-model="form.code"
            :class="ADMIN_INPUT_CLASS"
            autocomplete="off"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
          />
        </AdminField>

        <fieldset class="flex flex-col gap-2">
          <legend class="mb-1.5 text-sm font-semibold">
            {{ $t('admin.polygon.form.mode.label') }}
          </legend>
          <label
            v-for="mode in IMPORT_MODES"
            :key="mode"
            class="flex min-h-11 flex-wrap items-center gap-2"
          >
            <input
              v-model="form.mode"
              type="radio"
              name="import-mode"
              :value="mode"
              :disabled="!canUseMode(mode)"
            />
            {{ $t(`admin.polygon.form.mode.${mode}`) }}
            <span v-if="!canUseMode(mode)" class="basis-full pl-6 text-sm text-muted">
              {{ $t('admin.ui.needsPermission', { permission: IMPORT_MODE_PERMISSION[mode] }) }}
            </span>
          </label>
          <p v-if="errorOf('mode')" class="text-sm text-negative">{{ errorOf('mode') }}</p>
        </fieldset>

        <AdminField
          v-slot="{ id, describedBy }"
          :label="$t('admin.polygon.form.group')"
          :error="errorOf('groupId')"
        >
          <select
            :id="id"
            v-model="form.groupId"
            :class="ADMIN_INPUT_CLASS"
            :aria-describedby="describedBy"
          >
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
            :class="ADMIN_INPUT_CLASS"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
          />
        </AdminField>

        <fieldset class="flex flex-col gap-2 @lg:col-span-2">
          <legend class="mb-1.5 text-sm font-semibold">{{ $t('admin.polygon.form.types') }}</legend>
          <p v-if="errorOf('typeIds')" class="text-sm text-negative">{{ errorOf('typeIds') }}</p>
          <label v-for="type in types" :key="type.id" class="flex min-h-11 items-center gap-2">
            <input v-model="form.typeIds" type="checkbox" :value="type.id" />
            {{ type.fullName }}
          </label>
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
            :class="ADMIN_INPUT_CLASS"
            autocomplete="off"
            :aria-describedby="describedBy"
          />
        </AdminField>

        <AdminField
          v-slot="{ id }"
          :label="$t('admin.polygon.form.solutionLanguage')"
          :error="errorOf('tutorialLanguage')"
        >
          <input
            :id="id"
            v-model="form.tutorialLanguage"
            :class="ADMIN_INPUT_CLASS"
            autocomplete="off"
          />
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
            :class="[ADMIN_INPUT_CLASS, 'py-2']"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
          />
        </AdminField>
      </div>

      <div class="flex flex-col gap-4">
        <AdminSwitch
          v-model="form.ignoreZeroPointBatches"
          :label="$t('admin.polygon.form.ignoreBatches')"
        />
        <AdminSwitch
          v-model="form.ignoreZeroPointCases"
          :label="$t('admin.polygon.form.ignoreCases')"
        />
        <AdminSwitch
          v-model="form.appendMainSolution"
          :label="$t('admin.polygon.form.appendSolution')"
        />
      </div>

      <slot name="extra" />

      <div class="flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <slot name="actions" />
        <button
          type="submit"
          class="ml-auto"
          :class="ADMIN_PRIMARY_CLASS"
          :aria-disabled="isSubmitBlocked || undefined"
        >
          {{ $t('admin.polygon.form.submit') }}
        </button>
        <p v-if="withFile && !form.file" class="basis-full text-sm text-muted">
          {{ $t('admin.polygon.form.submitNeedsFile') }}
        </p>
      </div>
    </form>
  </section>
</template>
