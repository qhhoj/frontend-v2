<script setup lang="ts">
import { computed, ref, shallowRef, toRaw, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppButton from '@/components/ui/AppButton.vue';
import SegmentedControl from '@/components/ui/SegmentedControl.vue';
import TextInput from '@/components/ui/TextInput.vue';
import { numberBoxValue } from '../../ui/form/number-box';
import { caseBody, casesFromPairs } from './test-cases';
import type { KeyedCase } from './test-cases';
import { newPairsOnly, pairArchiveFiles, splitPoints, totalPointsOf } from './zip-autofill';

type AutofillMode = 'replace' | 'append';
/** What `start` put in the table: the rows it started from (for the other mode and for undo) and the list it made. */
interface Applied {
  base: KeyedCase[];
  list: KeyedCase[];
  snapshot: string;
  added: number;
  skipped: number;
}

/**
 * Tests from the archive's input/output pairs, made in the table at once (`start`, called after an upload or from "Tạo
 * test từ gói"): after the existing tests when there are some (pairs already listed are skipped), else as the whole
 * list, the problem's points split across them. The bar then offers the same choices the old dialog had (add or replace,
 * the total to split) and "Hoàn tác"; a choice re-makes the rows from the list as it was before `start`. The bar is
 * there only while the list is exactly the one it made: an edit in the table, a save or a discard retires it, so a
 * choice never overwrites the teacher's own edits. Nothing is saved here.
 */
const cases = defineModel<KeyedCase[]>({ required: true });
const props = defineProps<{ archiveFiles: string[]; problemPoints: number | null }>();
const emit = defineEmits<{ invalid: [key: number, isInvalid: boolean] }>();
const { t } = useI18n();
const KEY = 'admin.problems.data.autofill';

/** The files `start` was given (an upload's own answer, which is ahead of the prop), else the archive's as the page has them. */
const startedFrom = shallowRef<string[] | null>(null);
watch(
  () => props.archiveFiles,
  () => (startedFrom.value = null),
);
const pairing = computed(() => pairArchiveFiles(startedFrom.value ?? props.archiveFiles));
const applied = shallowRef<Applied | null>(null);
const mode = ref<AutofillMode>('replace');
const total = ref<number | null>(null);
const snapshotOf = (list: readonly KeyedCase[]) => JSON.stringify(list.map(caseBody));
const live = computed(() => {
  const made = applied.value;
  const isSame =
    made && made.list === toRaw(cases.value) && made.snapshot === snapshotOf(cases.value);
  return isSame ? made : null;
});
const isTotalOk = computed(
  () => total.value !== null && Number.isSafeInteger(total.value) && total.value >= 0,
);

/** Replaced rows take their args-box flags with them, as a removed row does. */
function make(base: KeyedCase[]) {
  const isReplace = mode.value === 'replace';
  const pairs = isReplace ? pairing.value.pairs : newPairsOnly(pairing.value.pairs, base);
  const rows = casesFromPairs(pairs, splitPoints(total.value ?? 0, pairs.length));
  if (isReplace) base.forEach((row) => emit('invalid', row.key, false));
  const list = isReplace ? rows : [...base, ...rows];
  cases.value = list;
  applied.value = {
    base,
    list,
    snapshot: snapshotOf(list),
    added: rows.length,
    skipped: pairing.value.pairs.length - pairs.length,
  };
}

function start(files?: string[]) {
  startedFrom.value = files ?? null;
  if (pairing.value.pairs.length === 0) return;
  const base = [...toRaw(cases.value)];
  mode.value = base.length > 0 ? 'append' : 'replace';
  total.value = totalPointsOf(props.problemPoints);
  make(base);
}
/** A choice in the bar: the rows are made again from the list as it was, unless the total cannot be split. */
function remake() {
  if (live.value && isTotalOk.value) make(live.value.base);
}
function setMode(next: AutofillMode) {
  if (next === mode.value) return;
  mode.value = next;
  remake();
}
function setTotal(event: Event) {
  total.value = numberBoxValue(event);
  remake();
}
function undo() {
  if (!live.value) return;
  cases.value = live.value.base;
  applied.value = null;
}
defineExpose({ start, pairCount: computed(() => pairing.value.pairs.length), live });

const modeOptions = computed(() =>
  (['append', 'replace'] as const).map((value) => ({
    value,
    label: t(`${KEY}.modes.${value}`, { count: live.value?.base.length ?? 0 }),
    testid: `autofill-mode-${value}`,
  })),
);
const statusText = computed(() => {
  const made = live.value;
  if (!made) return '';
  if (made.added === 0) return t(`${KEY}.nothingNew`, { count: made.skipped });
  const said = t(`${KEY}.${mode.value === 'replace' ? 'appliedReplace' : 'applied'}`, {
    count: made.added,
  });
  return made.skipped > 0 ? `${said} ${t(`${KEY}.skipped`, { count: made.skipped })}` : said;
});
</script>

<template>
  <div
    v-if="live"
    data-testid="autofill-applied"
    class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card border border-line bg-surface-strong px-4 py-2"
  >
    <p role="status" class="m-0 min-w-0 flex-1 basis-64 text-meta">{{ statusText }}</p>
    <SegmentedControl
      v-if="live.base.length > 0"
      size="sm"
      :label="t(`${KEY}.modeLegend`)"
      :options="modeOptions"
      :model-value="mode"
      @update:model-value="setMode"
    />
    <label class="flex items-center gap-2 text-meta" :title="t(`${KEY}.totalHint`)">
      {{ t(`${KEY}.total`) }}
      <span class="block w-24">
        <TextInput
          :model-value="total ?? ''"
          type="number"
          min="0"
          step="1"
          inputmode="numeric"
          class="text-right font-mono tabular-nums"
          data-testid="autofill-total"
          :aria-invalid="isTotalOk ? undefined : 'true'"
          @input="setTotal"
        />
      </span>
    </label>
    <AppButton size="sm" tone="quiet" data-testid="autofill-undo" @click="undo">
      {{ t('common.undo') }}
    </AppButton>
  </div>
</template>
