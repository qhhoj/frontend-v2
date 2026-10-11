<script setup lang="ts">
import Dialog from 'primevue/dialog';
import { TriangleAlert } from 'lucide-vue-next';
import { computed, ref, useId, watch } from 'vue';
import ScrollRegion from '@/components/ScrollRegion.vue';
import AdminChip from '../../ui/AdminChip.vue';
import AdminField from '../../ui/AdminField.vue';
import { BUTTON, INPUT } from '../../ui/controls';
import { casesFromPairs } from './test-cases';
import type { KeyedCase } from './test-cases';
import { newPairsOnly, pairArchiveFiles, splitPoints, totalPointsOf } from './zip-autofill';

export type AutofillMode = 'replace' | 'append';

/**
 * "Tạo test từ gói zip": previews the archive's input/output pairs (and the files left over), lets the teacher replace or
 * append and set the total split across them, then hands the new rows back. Nothing is saved here: the rows join the form.
 */
const visible = defineModel<boolean>('visible', { required: true });
const props = defineProps<{
  archiveFiles: string[];
  cases: KeyedCase[];
  problemPoints: number | null;
}>();
const emit = defineEmits<{ apply: [rows: KeyedCase[], mode: AutofillMode] }>();
const titleId = useId();

const mode = ref<AutofillMode>('replace');
const total = ref(totalPointsOf(props.problemPoints));
watch(visible, (isOpen) => {
  if (!isOpen) return;
  mode.value = props.cases.length > 0 ? 'append' : 'replace';
  total.value = totalPointsOf(props.problemPoints);
});

const pairing = computed(() => pairArchiveFiles(props.archiveFiles));
const pairs = computed(() =>
  mode.value === 'append' ? newPairsOnly(pairing.value.pairs, props.cases) : pairing.value.pairs,
);
const skippedCount = computed(() => pairing.value.pairs.length - pairs.value.length);
const isTotalOk = computed(() => Number.isSafeInteger(total.value) && total.value >= 0);
const shares = computed(() => splitPoints(isTotalOk.value ? total.value : 0, pairs.value.length));
const canApply = computed(() => pairs.value.length > 0 && isTotalOk.value);

function apply() {
  if (!canApply.value) return;
  emit('apply', casesFromPairs(pairs.value, shares.value), mode.value);
  visible.value = false;
}
const HEAD = 'border-b border-line px-2 py-1.5 text-left text-xs font-semibold text-muted';
const CELL = 'border-b border-line px-2 py-1.5';
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :draggable="false"
    :style="{ width: '720px', maxWidth: 'calc(100vw - 2rem)' }"
    :close-button-props="{ 'aria-label': $t('common.close') }"
    :pt="{ root: { 'aria-labelledby': titleId } }"
  >
    <template #header>
      <h2 :id="titleId" class="font-display text-lg font-semibold">
        {{ $t('admin.problems.data.autofill.title') }}
      </h2>
    </template>
    <form
      data-testid="zip-autofill"
      class="flex min-w-0 flex-col gap-4"
      novalidate
      @submit.prevent="apply"
    >
      <p class="text-base font-semibold" role="status">
        {{ $t('admin.problems.data.autofill.found', { count: pairing.pairs.length }) }}
      </p>
      <p v-if="pairing.pairs.length === 0" class="text-sm text-muted">
        {{ $t('admin.problems.data.autofill.rules') }}
      </p>
      <fieldset v-if="cases.length > 0 && pairing.pairs.length > 0" class="flex flex-wrap gap-2">
        <legend class="mb-2 text-sm font-semibold">
          {{ $t('admin.problems.data.autofill.modeLegend') }}
        </legend>
        <label
          v-for="option in ['append', 'replace'] as const"
          :key="option"
          class="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-pill border border-line-strong px-4 text-sm font-semibold has-[:checked]:bg-accent-soft has-[:checked]:text-accent-soft-text has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus"
        >
          <input v-model="mode" type="radio" :value="option" class="sr-only" />
          {{ $t(`admin.problems.data.autofill.modes.${option}`, { count: cases.length }) }}
        </label>
      </fieldset>
      <p v-if="skippedCount > 0" class="text-sm text-muted">
        {{ $t('admin.problems.data.autofill.skipped', { count: skippedCount }) }}
      </p>
      <AdminField
        v-if="pairs.length > 0"
        v-slot="{ id, describedBy, invalid }"
        :label="$t('admin.problems.data.autofill.total')"
        :hint="$t('admin.problems.data.autofill.totalHint')"
        :error="isTotalOk ? undefined : $t('admin.problems.data.errors.count')"
      >
        <input
          :id="id"
          v-model.number="total"
          type="number"
          min="0"
          step="1"
          inputmode="numeric"
          :class="[INPUT, 'max-w-40']"
          :aria-describedby="describedBy"
          :aria-invalid="invalid"
        />
      </AdminField>
      <ScrollRegion
        v-if="pairs.length > 0"
        class="max-h-72 min-w-0 rounded-cell border border-line"
        :label="$t('admin.problems.data.autofill.previewLabel')"
        no-hint
      >
        <table class="w-full border-separate border-spacing-0 text-sm">
          <caption class="sr-only">
            {{
              $t('admin.problems.data.autofill.previewLabel')
            }}
          </caption>
          <thead class="sticky top-0 bg-surface-solid">
            <tr>
              <th scope="col" :class="HEAD">#</th>
              <th scope="col" :class="HEAD">{{ $t('admin.problems.data.cases.columns.input') }}</th>
              <th scope="col" :class="HEAD">
                {{ $t('admin.problems.data.cases.columns.output') }}
              </th>
              <th scope="col" :class="[HEAD, 'text-right']">
                {{ $t('admin.problems.data.cases.columns.points') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(pair, index) in pairs" :key="pair.key" data-testid="autofill-pair">
              <td :class="[CELL, 'text-muted tabular-nums']">{{ index + 1 }}</td>
              <td :class="[CELL, 'font-mono break-all']">{{ pair.input }}</td>
              <td :class="[CELL, 'font-mono break-all']">{{ pair.output }}</td>
              <td :class="[CELL, 'text-right tabular-nums']">{{ shares[index] }}</td>
            </tr>
          </tbody>
        </table>
      </ScrollRegion>
      <section
        v-if="pairing.unpaired.length > 0"
        data-testid="autofill-unpaired"
        class="flex flex-col gap-2 rounded-cell border border-line bg-surface-strong p-3"
      >
        <h3 class="flex items-center gap-1.5 text-sm font-semibold">
          <TriangleAlert
            aria-hidden="true"
            class="size-4 shrink-0 text-verdict-tle"
            :stroke-width="1.75"
          />
          {{ $t('admin.problems.data.autofill.unpaired', { count: pairing.unpaired.length }) }}
        </h3>
        <p class="text-xs text-muted">
          {{ $t('admin.problems.data.autofill.unpairedHint') }}
        </p>
        <ul class="flex flex-wrap gap-1.5">
          <li v-for="file in pairing.unpaired" :key="file">
            <AdminChip tone="caution"
              ><span class="font-mono">{{ file }}</span></AdminChip
            >
          </li>
        </ul>
      </section>
      <details v-if="pairing.others.length > 0" class="text-sm">
        <summary class="inline-flex min-h-8 cursor-pointer items-center text-muted">
          {{ $t('admin.problems.data.autofill.others', { count: pairing.others.length }) }}
        </summary>
        <ul class="mt-2 flex flex-wrap gap-1.5">
          <li v-for="file in pairing.others" :key="file">
            <AdminChip
              ><span class="font-mono">{{ file }}</span></AdminChip
            >
          </li>
        </ul>
      </details>
      <div class="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
        <button type="button" :class="BUTTON.ghost" @click="visible = false">
          {{ $t('common.cancel') }}
        </button>
        <button
          type="submit"
          :class="BUTTON.primary"
          :aria-disabled="!canApply || undefined"
          data-testid="autofill-apply"
        >
          {{ $t('admin.problems.data.autofill.apply', { count: pairs.length }) }}
        </button>
      </div>
    </form>
  </Dialog>
</template>
