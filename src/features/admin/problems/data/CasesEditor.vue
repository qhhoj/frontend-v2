<script setup lang="ts">
import { computed, ref } from 'vue';
import { translate } from '@/i18n';
import type { ProblemData } from '@/api/types/problem-data';
import { FileArchive, Plus } from 'lucide-vue-next';
import ScrollRegion from '@/components/ScrollRegion.vue';
import { buttonClass } from '../../ui/controls';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import CaseRow from './CaseRow.vue';
import ZipAutofillDialog from './ZipAutofillDialog.vue';
import type { AutofillMode } from './ZipAutofillDialog.vue';
import { useAdminToast } from '../../ui/feedback/use-admin-toast';
import {
  addBatch,
  addCase,
  caseCount,
  listWarnings,
  MASS_TESTCASE_LIMIT,
  moveCase,
  removeCase,
} from './test-cases';
import type { KeyedCase, ListWarning } from './test-cases';
import type { FieldErrors } from '../../ui/admin-errors';

const cases = defineModel<KeyedCase[]>({ required: true });
const props = defineProps<{
  data: ProblemData;
  errors: FieldErrors;
  /** The problem's points: the default total the zip autofill splits across its tests. */
  problemPoints?: number | null;
}>();
const emit = defineEmits<{ invalid: [key: number, isInvalid: boolean] }>();

const warnings = computed(() => listWarnings({ cases: cases.value }, props.data));
const isOverSoft = computed(() => warnings.value.some((warning) => warning.kind === 'over-soft'));
const isOverMax = computed(() => warnings.value.some((warning) => warning.kind === 'over-max'));
const countLine = computed(() => {
  const count = caseCount(cases.value);
  return isOverSoft.value
    ? translate('admin.problems.data.cases.countOver', { count, soft: props.data.limits.softCases })
    : translate('admin.problems.data.cases.count', { count });
});

function warningTextOf(warning: ListWarning): string {
  if (warning.kind === 'missing-file')
    return translate('admin.problems.data.cases.warnings.missingFile', {
      file: warning.file ?? '',
    });
  if (warning.kind === 'unclosed-batch')
    return translate('admin.problems.data.cases.warnings.unclosedBatch');
  return translate('admin.problems.data.cases.warnings.strayEnd');
}
/** A row's messages: its list warnings, then the refusals its fields would get from the backend. */
const messagesAt = (index: number) => {
  const prefix = `cases.${index}.`;
  const rowErrors = Object.entries(props.errors)
    .filter(([key]) => key.startsWith(prefix))
    .map(([, text]) => text);
  return [
    ...warnings.value.filter((warning) => warning.index === index).map(warningTextOf),
    ...rowErrors,
  ];
};

const HEAD = 'border-b border-line px-2 py-2 whitespace-nowrap';

const isAutofillShown = ref(false);
const toast = useAdminToast();
/** Replaced rows take their args-box flags with them, as a removed row does. */
function applyAutofill(rows: KeyedCase[], mode: AutofillMode) {
  if (mode === 'replace') cases.value.forEach((row) => emit('invalid', row.key, false));
  cases.value = mode === 'replace' ? rows : [...cases.value, ...rows];
  toast.show({
    text: translate('admin.problems.data.autofill.appliedToast', { count: rows.length }),
  });
}

function move(index: number, offset: -1 | 1) {
  cases.value = moveCase(cases.value, index, offset);
}

/** A removed row's args box goes with it: it must not keep the list from saving. */
function remove(index: number) {
  emit('invalid', cases.value[index]!.key, false);
  cases.value = removeCase(cases.value, index);
}
</script>

<template>
  <AdminFormSection
    :title="$t('admin.problems.data.cases.title')"
    :description="countLine"
    :columns="1"
  >
    <p v-if="isOverMax" role="alert" class="text-sm text-negative">
      {{ $t('admin.problems.data.cases.overMax', { max: data.limits.maxCases }) }}
    </p>
    <p v-if="errors.cases" role="alert" class="text-sm text-negative">{{ errors.cases }}</p>
    <p v-if="data.limits.maxCases < MASS_TESTCASE_LIMIT" class="text-xs text-muted">
      {{
        $t('admin.problems.data.cases.hardLimit', {
          max: MASS_TESTCASE_LIMIT,
          permission: $t('admin.permissions.judge.create_mass_testcases'),
        })
      }}
    </p>
    <datalist id="archive-files">
      <option v-for="file in data.archiveFiles" :key="file" :value="file" />
    </datalist>
    <ScrollRegion class="min-w-0" :label="$t('admin.problems.data.cases.title')" no-hint>
      <table class="w-full min-w-[52rem] border-separate border-spacing-0 text-sm">
        <caption class="sr-only">
          {{
            $t('admin.problems.data.cases.title')
          }}
        </caption>
        <thead>
          <tr class="text-left text-xs font-semibold text-muted">
            <th scope="col" :class="[HEAD, 'sticky left-0 z-10 bg-surface']">
              {{ $t('admin.problems.data.cases.columns.order') }}
            </th>
            <th scope="col" :class="HEAD">{{ $t('admin.problems.data.cases.columns.type') }}</th>
            <th scope="col" :class="HEAD">
              {{ $t('admin.problems.data.cases.columns.input') }} /
              {{ $t('admin.problems.data.cases.columns.output') }}
            </th>
            <th scope="col" :class="HEAD">{{ $t('admin.problems.data.cases.columns.points') }}</th>
            <th scope="col" :class="HEAD">{{ $t('admin.problems.data.cases.columns.options') }}</th>
            <th scope="col" :class="HEAD"><span class="sr-only">!</span></th>
          </tr>
        </thead>
        <tbody>
          <CaseRow
            v-for="(row, index) in cases"
            :key="row.key"
            :model-value="row"
            :index="index"
            :is-first="index === 0"
            :is-last="index === cases.length - 1"
            :messages="messagesAt(index)"
            @move="move(index, $event)"
            @remove="remove(index)"
            @invalid="emit('invalid', row.key, $event)"
          />
        </tbody>
      </table>
    </ScrollRegion>
    <div class="flex flex-wrap gap-2">
      <button
        v-if="data.archiveFiles.length > 0"
        type="button"
        data-testid="zip-autofill-open"
        :class="buttonClass(cases.length === 0 ? 'primary' : 'secondary')"
        @click="isAutofillShown = true"
      >
        <FileArchive aria-hidden="true" class="size-4" :stroke-width="1.75" />
        {{ $t('admin.problems.data.cases.autofill') }}
      </button>
      <button type="button" :class="buttonClass('secondary')" @click="cases = addCase(cases)">
        <Plus aria-hidden="true" class="size-4" :stroke-width="1.75" />
        {{ $t('admin.problems.data.cases.addCase') }}
      </button>
      <button type="button" :class="buttonClass('secondary')" @click="cases = addBatch(cases)">
        <Plus aria-hidden="true" class="size-4" :stroke-width="1.75" />
        {{ $t('admin.problems.data.cases.addBatch') }}
      </button>
    </div>
    <p class="text-xs text-muted">{{ $t('admin.problems.data.cases.legend') }}</p>
    <ZipAutofillDialog
      v-model:visible="isAutofillShown"
      :archive-files="data.archiveFiles"
      :cases="cases"
      :problem-points="problemPoints ?? null"
      @apply="applyAutofill"
    />
  </AdminFormSection>
</template>
