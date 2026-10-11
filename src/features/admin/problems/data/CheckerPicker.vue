<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Checker, ProblemData } from '@/api/types/problem-data';
import AdminField from '../../ui/AdminField.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import AdminCheckbox from '../../ui/form/AdminCheckbox.vue';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import { INPUT } from '../../ui/controls';
import {
  argsOf,
  CUSTOM_KINDS,
  DEFAULT_PRECISION,
  familyOf,
  FLOAT_CHECKERS,
  MAX_PRECISION,
  parseWeights,
  setFamily,
  setStockChecker,
  STOCK_CHECKERS,
  withArg,
} from './checker-config';
import type { CheckerFamily } from './checker-config';
import ChoiceCards from './ChoiceCards.vue';
import DataSourceRow from './DataSourceRow.vue';
import type { DataForm } from './test-cases';

/**
 * How an output is judged: a built-in rule with its options, or the teacher's own checker (testlib, Themis or DMOJ exit
 * codes) uploaded right here. Every control edits one key of the checker's arguments.
 */
const form = defineModel<DataForm>({ required: true });
const props = defineProps<{ code: string; data: ProblemData; errors: FieldErrors }>();
const { t } = useI18n();
const key = 'admin.problems.data.config';

const family = computed<CheckerFamily>({
  get: () => familyOf(form.value),
  set: (next) => setFamily(form.value, next),
});
const familyOptions = computed(() =>
  (['stock', ...CUSTOM_KINDS] as CheckerFamily[]).map((value) => ({
    value,
    label: t(`${key}.family.${value}.label`),
    description: t(`${key}.family.${value}.description`),
  })),
);
const stockChecker = computed<Checker>({
  get: () => form.value.checker,
  set: (next) => setStockChecker(form.value, next),
});
const args = computed(() => argsOf(form.value.checkerArgsText));
const setArg = (name: string, value: unknown) => {
  form.value.checkerArgsText = withArg(form.value.checkerArgsText, name, value);
};

const precision = computed(() => args.value.precision ?? DEFAULT_PRECISION);
function setPrecision(text: string) {
  setArg('precision', text.trim() === '' ? undefined : Number(text));
}
const peAllowed = computed({
  get: () => args.value.pe_allowed !== false,
  set: (on: boolean) => setArg('pe_allowed', on ? undefined : false),
});
const filterNewLine = computed({
  get: () => args.value.filter_new_line === true,
  set: (on: boolean) => setArg('filter_new_line', on ? true : undefined),
});
const fillerLines = computed({
  get: () => args.value.filler_lines_required !== false,
  set: (on: boolean) => setArg('filler_lines_required', on ? undefined : false),
});
const percentage = computed({
  get: () => args.value.treat_checker_points_as_percentage === true,
  set: (on: boolean) => setArg('treat_checker_points_as_percentage', on ? true : undefined),
});

/** The weights box keeps what was typed; only a valid list reaches the arguments. */
const weightsText = ref('');
const weightsInvalid = ref(false);
watch(
  () => [form.value.checker, args.value.point_distribution] as const,
  ([, weights]) => {
    if (Array.isArray(weights) && parseWeights(weightsText.value)?.join() !== weights.join())
      weightsText.value = weights.join(' ');
  },
  { immediate: true },
);
function setWeights(text: string) {
  weightsText.value = text;
  const weights = parseWeights(text);
  weightsInvalid.value = text.trim() !== '' && weights === null;
  if (weights || text.trim() === '') setArg('point_distribution', weights ?? undefined);
}
const weightsError = computed(() =>
  weightsInvalid.value
    ? t(`${key}.errors.weightsFormat`)
    : props.errors['checkerArgs.point_distribution'],
);
</script>

<template>
  <AdminFormSection
    id="data-checker-section"
    :title="t(`${key}.checkerTitle`)"
    :description="t(`${key}.checkerDescription`)"
    :columns="1"
  >
    <ChoiceCards
      v-model="family"
      :legend="t(`${key}.familyLegend`)"
      name="data-checker-family"
      :options="familyOptions"
    />

    <div v-if="family === 'stock'" class="grid gap-4 md:grid-cols-2">
      <AdminField
        v-slot="{ id, describedBy }"
        input-id="data-checker"
        :label="t(`${key}.stockLabel`)"
        :hint="t(`${key}.stock.${stockChecker}.hint`)"
      >
        <select :id="id" v-model="stockChecker" :class="INPUT" :aria-describedby="describedBy">
          <option v-for="option in STOCK_CHECKERS" :key="option" :value="option">
            {{ t(`${key}.stock.${option}.label`) }}
          </option>
        </select>
      </AdminField>

      <AdminField
        v-if="FLOAT_CHECKERS.includes(form.checker)"
        v-slot="{ id, describedBy, invalid }"
        input-id="data-checker-precision"
        :label="t(`${key}.precision`)"
        :hint="t(`${key}.precisionHint`, { n: precision })"
        :error="errors['checkerArgs.precision']"
      >
        <input
          :id="id"
          :value="args.precision ?? ''"
          type="number"
          inputmode="numeric"
          min="0"
          :max="MAX_PRECISION"
          :placeholder="String(DEFAULT_PRECISION)"
          :class="INPUT"
          :aria-describedby="describedBy"
          :aria-invalid="invalid ? 'true' : undefined"
          @input="setPrecision(($event.target as HTMLInputElement).value)"
        />
      </AdminField>

      <AdminField
        v-if="form.checker === 'sorted'"
        v-slot="{ id, describedBy }"
        input-id="data-checker-split"
        :label="t(`${key}.splitOn`)"
      >
        <select
          :id="id"
          :value="args.split_on ?? 'lines'"
          :class="INPUT"
          :aria-describedby="describedBy"
          @change="
            setArg(
              'split_on',
              ($event.target as HTMLSelectElement).value === 'lines'
                ? undefined
                : ($event.target as HTMLSelectElement).value,
            )
          "
        >
          <option value="lines">{{ t(`${key}.splitLines`) }}</option>
          <option value="whitespace">{{ t(`${key}.splitWhitespace`) }}</option>
        </select>
      </AdminField>

      <AdminField
        v-if="form.checker === 'linematches'"
        v-slot="{ id, describedBy, invalid }"
        input-id="data-checker-weights"
        :label="t(`${key}.weights`)"
        :hint="t(`${key}.weightsHint`)"
        :error="weightsError"
      >
        <input
          :id="id"
          :value="weightsText"
          :class="[INPUT, 'font-mono']"
          autocomplete="off"
          spellcheck="false"
          :aria-describedby="describedBy"
          :aria-invalid="invalid ? 'true' : undefined"
          @input="setWeights(($event.target as HTMLInputElement).value)"
        />
      </AdminField>

      <AdminCheckbox
        v-if="form.checker === 'identical'"
        v-model="peAllowed"
        input-id="data-checker-pe"
        :label="t(`${key}.peAllowed`)"
        :description="t(`${key}.peAllowedHint`)"
      />
      <AdminCheckbox
        v-if="form.checker === 'rstripped'"
        v-model="filterNewLine"
        input-id="data-checker-blank-lines"
        :label="t(`${key}.filterNewLine`)"
      />
      <AdminCheckbox
        v-if="form.checker === 'linematches'"
        v-model="fillerLines"
        input-id="data-checker-filler"
        :label="t(`${key}.fillerLines`)"
        :description="t(`${key}.fillerLinesHint`)"
      />
    </div>

    <div v-else class="flex flex-col gap-4">
      <ul class="m-0 list-none rounded-cell border border-line p-0">
        <DataSourceRow
          :code="code"
          kind="customChecker"
          :label="t(`${key}.checkerFile`)"
          :stored-name="data.customChecker"
        />
      </ul>
      <AdminStatus
        v-if="!data.customChecker"
        kind="queued"
        data-testid="checker-file-missing"
        :text="t(`${key}.checkerFileMissing`)"
      />
      <AdminCheckbox
        v-if="family === 'testlib'"
        v-model="percentage"
        input-id="data-checker-percentage"
        :label="t(`${key}.percentage`)"
        :description="t(`${key}.percentageHint`)"
      />
      <p v-if="family === 'themis'" class="text-sm text-muted" data-testid="themis-hint">
        {{ t(`${key}.themisHint`) }}
      </p>
    </div>
  </AdminFormSection>
</template>
