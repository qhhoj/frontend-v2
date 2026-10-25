<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Checker } from '@/api/types/problem-data';
import AdminField from '../../ui/AdminField.vue';
import AdminCheckbox from '../../ui/form/AdminCheckbox.vue';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import { INPUT } from '../../ui/controls';
import { numberBoxValue } from '../../ui/form/number-box';
import {
  argsOf,
  DEFAULT_PRECISION,
  familyOf,
  FLOAT_CHECKERS,
  MAX_PRECISION,
  parseWeights,
  setStockChecker,
  STOCK_CHECKERS,
  withArg,
} from './checker-config';
import type { DataForm } from './test-cases';

/**
 * The Advanced view of the checker: the built-in rule and its options, or a testlib checker's percentage flag. The checker
 * type itself is picked in the Basic view. Every control edits one key of the checker's arguments.
 */
const form = defineModel<DataForm>({ required: true });
const props = defineProps<{ errors: FieldErrors }>();
const { t } = useI18n();
const key = 'admin.problems.data.config';
const family = computed(() => familyOf(form.value));
const stockChecker = computed<Checker>({
  get: () => form.value.checker,
  set: (next) => setStockChecker(form.value, next),
});
const args = computed(() => argsOf(form.value.checkerArgsText));
const setArg = (name: string, value: unknown) => {
  form.value.checkerArgsText = withArg(form.value.checkerArgsText, name, value);
};

const precision = computed(() => args.value.precision ?? DEFAULT_PRECISION);
/** An empty box leaves the default; text the browser cannot read is kept as not-a-number, which the check refuses. */
function setPrecision(event: Event) {
  setArg('precision', numberBoxValue(event) ?? undefined);
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
    id="data-checker-options-section"
    :title="t(`${key}.checkerOptionsTitle`)"
    :description="t(`${key}.checkerOptionsDescription`)"
    :columns="1"
  >
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
          @input="setPrecision($event)"
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

    <AdminCheckbox
      v-else-if="family === 'testlib'"
      v-model="percentage"
      input-id="data-checker-percentage"
      :label="t(`${key}.percentage`)"
      :description="t(`${key}.percentageHint`)"
    />
    <p v-else class="text-sm text-muted">{{ t(`${key}.checkerNoOptions`) }}</p>
  </AdminFormSection>
</template>
