<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ProblemData } from '@/api/types/problem-data';
import FormField from '@/components/ui/FormField.vue';
import Notice from '@/components/ui/Notice.vue';
import SegmentedControl from '@/components/ui/SegmentedControl.vue';
import SelectField from '@/components/ui/SelectField.vue';
import { CUSTOM_KINDS, familyOf, setFamily, setGrader } from './checker-config';
import type { CustomKind } from './checker-config';
import DataSourceRow from './DataSourceRow.vue';
import SourceCheckStatus from './SourceCheckStatus.vue';
import type { DataForm } from './test-cases';

/**
 * How a result is compared: with a built-in rule (the default), with the teacher's own checker, or by the problem's
 * interactor. The file each choice needs is uploaded right under it, with the judge's compile check. The toggles show
 * what is stored and write it only through the old pickers' setters (`setFamily`, `setGrader`), one choice at a time;
 * the files of a stored setting stay listed whatever the toggle says.
 */
const form = defineModel<DataForm>({ required: true });
defineProps<{ code: string; data: ProblemData }>();
const { t } = useI18n();
const key = 'admin.problems.data.config';

type CompareMode = 'stock' | 'custom' | 'interactive';
const isCustom = computed(() => form.value.checker === 'bridged');
const isInteractive = computed(() => form.value.grader === 'interactive');
const mode = computed<CompareMode>(() => {
  if (isInteractive.value) return 'interactive';
  return isCustom.value ? 'custom' : 'stock';
});
const modeOptions = computed(() =>
  (['stock', 'custom', 'interactive'] as const).map((value) => ({
    value,
    label: t(`${key}.compare.${value}`),
    testid: `compare-${value}`,
  })),
);
/** The mode already shown changes nothing: a built-in rule and its options are never reset by a second click. */
function setMode(next: CompareMode) {
  if (next === mode.value) return;
  if (next === 'interactive') return setGrader(form.value, 'interactive');
  if (isInteractive.value) setGrader(form.value, 'standard');
  if (next === 'custom' && !isCustom.value) setFamily(form.value, 'testlib');
  if (next === 'stock' && isCustom.value) setFamily(form.value, 'stock');
}

const kind = computed<CustomKind>({
  get: () => familyOf(form.value) as CustomKind,
  set: (next) => {
    if (next !== familyOf(form.value)) setFamily(form.value, next);
  },
});
const kindOptions = computed(() =>
  CUSTOM_KINDS.map((value) => ({ value, label: t(`${key}.family.${value}.label`) })),
);
const FILE_LIST = 'm-0 list-none divide-y divide-line rounded-control border border-line p-0';
</script>

<template>
  <div class="flex flex-col gap-3" data-testid="compare-mode">
    <p id="data-compare-label" class="m-0 text-meta text-muted">{{ t(`${key}.compare.label`) }}</p>
    <SegmentedControl
      size="sm"
      :label="t(`${key}.compare.label`)"
      :options="modeOptions"
      :model-value="mode"
      @update:model-value="setMode"
    />
    <p
      v-if="mode === 'stock' && form.checker !== 'standard'"
      class="m-0 text-meta text-muted"
      data-testid="compare-other-rule"
    >
      {{ t(`${key}.compare.otherRule`, { rule: t(`${key}.stock.${form.checker}.label`) }) }}
    </p>
    <template v-if="isCustom">
      <FormField
        input-id="data-checker-kind"
        :label="t(`${key}.familyLegend`)"
        :hint="t(`${key}.family.${kind}.description`)"
      >
        <SelectField v-model="kind" :options="kindOptions" />
      </FormField>
      <ul :class="FILE_LIST">
        <DataSourceRow
          :code="code"
          kind="customChecker"
          :label="t(`${key}.checkerFile`)"
          :stored-name="data.customChecker"
        />
      </ul>
      <SourceCheckStatus
        :check="data.sourceChecks.customChecker"
        :stored-name="data.customChecker"
      />
      <Notice
        v-if="!data.customChecker"
        tone="warning"
        inline
        role="status"
        data-testid="checker-file-missing"
      >
        {{ t(`${key}.checkerFileMissing`) }}
      </Notice>
      <p v-if="kind === 'themis'" class="m-0 text-meta text-muted" data-testid="themis-hint">
        {{ t(`${key}.themisHint`) }}
      </p>
    </template>
    <template v-if="isInteractive">
      <ul :class="FILE_LIST">
        <DataSourceRow
          :code="code"
          kind="customGrader"
          :label="t(`${key}.interactorFile`)"
          :stored-name="data.customGrader"
        />
      </ul>
      <SourceCheckStatus :check="data.sourceChecks.customGrader" :stored-name="data.customGrader" />
      <Notice v-if="!data.customGrader" tone="warning" inline role="status">
        {{ t(`${key}.interactorMissing`) }}
      </Notice>
    </template>
  </div>
</template>
