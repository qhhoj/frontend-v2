<script setup lang="ts">
import { computed, ref, shallowRef, toRaw } from 'vue';
import { FileArchive } from 'lucide-vue-next';
import { translate } from '@/i18n';
import AdminStatus from '../../ui/AdminStatus.vue';
import { buttonClass } from '../../ui/controls';
import type { KeyedCase } from './test-cases';
import ZipAutofillDialog from './ZipAutofillDialog.vue';
import type { AutofillMode } from './ZipAutofillDialog.vue';

/**
 * "Tạo test từ gói zip": the button, its dialog, and the "added N tests, now save" line. Laid out as part of the parent's
 * button row (`display: contents`): the line takes a full row above the buttons.
 */
const cases = defineModel<KeyedCase[]>({ required: true });
const props = defineProps<{
  archiveFiles: string[];
  /** The problem's points: the default total the autofill splits across its tests. */
  problemPoints: number | null;
}>();
const emit = defineEmits<{ invalid: [key: number, isInvalid: boolean] }>();

const isShown = ref(false);
/**
 * Shown inline (a toast would sit over the save bar it points to) while the list is still the one the autofill made; any
 * later change, a save or a discard replaces the list and hides it.
 */
const applied = shallowRef<{ list: KeyedCase[]; count: number } | null>(null);
const appliedText = computed(() =>
  applied.value && applied.value.list === toRaw(cases.value)
    ? translate('admin.problems.data.autofill.applied', { count: applied.value.count })
    : '',
);
/** Replaced rows take their args-box flags with them, as a removed row does. */
function apply(rows: KeyedCase[], mode: AutofillMode) {
  if (mode === 'replace') cases.value.forEach((row) => emit('invalid', row.key, false));
  const list = mode === 'replace' ? rows : [...cases.value, ...rows];
  cases.value = list;
  applied.value = { list: toRaw(list), count: rows.length };
}
</script>

<template>
  <div v-if="props.archiveFiles.length > 0" class="contents">
    <AdminStatus
      v-if="appliedText"
      kind="done"
      class="order-first basis-full"
      data-testid="autofill-applied"
      :text="appliedText"
    />
    <button
      type="button"
      data-testid="zip-autofill-open"
      :class="buttonClass(cases.length === 0 ? 'primary' : 'secondary')"
      @click="isShown = true"
    >
      <FileArchive aria-hidden="true" class="size-4" :stroke-width="1.75" />
      {{ $t('admin.problems.data.cases.autofill') }}
    </button>
    <ZipAutofillDialog
      v-model:visible="isShown"
      :archive-files="archiveFiles"
      :cases="cases"
      :problem-points="problemPoints"
      @apply="apply"
    />
  </div>
</template>
