<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { updatePolygonLink } from '@/api/polygon.api';
import AppButton from '@/components/ui/AppButton.vue';
import type { PolygonLink } from '@/api/types/polygon';
import AdminDrawer from '../../ui/AdminDrawer.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import ImportCheckbox from '../import/ImportCheckbox.vue';
import { importRefusalText } from '../import/import-refusal';
import PolygonLanguageFields from './PolygonLanguageFields.vue';
import type { ImportErrorText } from './polygon-import-errors';
import {
  isLanguageFieldDrawn,
  repeatedLanguageErrors,
  repeatedLanguages,
  withEveryStatement,
} from './polygon-languages';
import type { LanguageChoice } from './polygon-languages';
import {
  isFailureAnswered,
  linkChoiceOf,
  linkOptionsBodyOf,
  linkStatementsOf,
} from './polygon-link-options';
import type { OptionsFailure } from './polygon-link-options';
import { optionsFailureOf, optionsFieldOf, optionsRefusalOf } from './polygon-options-refusal';

/**
 * "Sửa" on the link panel (option C): the saved sync options in a 560 px drawer. The statements come from the saved
 * options, the last sync's failure and every refusal of a save here (no preview without the link's token); a statement a
 * refusal adds gets its select at once, so the refusal shows under it. The last sync's fix shows under its field while the
 * choice does not answer it yet. A refusal whose field is still not drawn shows on the page line. Saving replaces the
 * options for the next sync; the server checks them against Polygon as it is now.
 */
const props = defineProps<{ code: string; link: PolygonLink; error: ImportErrorText }>();
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ saved: [link: PolygonLink] }>();

const lastSync = computed(() => ({
  code: props.link.lastSyncErrorCode,
  params: props.link.lastSyncErrorParams,
}));
/** Refusals of a save, kept after the choice changes: the statements they name stay on offer. */
const refusedSaves = ref<OptionsFailure[]>([]);
const statements = computed(() =>
  linkStatementsOf(props.link.options, [lastSync.value, ...refusedSaves.value]),
);
const languages = ref(linkChoiceOf(props.link.options, statements.value));
watch(statements, (next) => (languages.value = withEveryStatement(next, languages.value)));
const flags = ref({
  ignoreZeroPointBatches: props.link.options.ignoreZeroPointBatches,
  ignoreZeroPointCases: props.link.options.ignoreZeroPointCases,
  appendMainSolution: props.link.options.appendMainSolution,
});

const save = useAdminMutation({
  mutate: () => updatePolygonLink(props.code, linkOptionsBodyOf(languages.value, flags.value)),
  onSuccess: (link) => emit('saved', link),
});
const refusal = computed(() => optionsRefusalOf(save.failure.value));
watch(save.failure, (error) => {
  const failure = optionsFailureOf(error);
  if (failure) refusedSaves.value = [...refusedSaves.value, failure];
});
/** The setter's own choice: a refusal of the choice as sent no longer holds. */
function choose(next: LanguageChoice) {
  languages.value = next;
  if (refusal.value) save.reset();
}

/** The fix of the last sync's failure under its field until the choice answers it; this save's refusal over it. */
const fieldErrors = computed(() => {
  const errors = repeatedLanguageErrors(languages.value);
  if (refusal.value?.field) errors[refusal.value.field] = refusal.value.text;
  const { code, params } = lastSync.value;
  const field = code ? optionsFieldOf(code, params ?? {}) : null;
  if (field && !isFailureAnswered(lastSync.value, languages.value))
    errors[field] ??= props.error.fix;
  return errors;
});
const pageRefusal = computed(() => {
  const field = refusal.value?.field;
  if (!save.failure.value) return null;
  if (field && isLanguageFieldDrawn(field, statements.value, languages.value)) return null;
  return refusal.value?.text ?? importRefusalText(save.failure.value);
});
const submit = () => repeatedLanguages(languages.value).length === 0 && save.run(undefined);
</script>

<template>
  <AdminDrawer v-model:visible="visible" :title="$t('admin.polygonLink.panel.drawer.title')">
    <PolygonLanguageFields
      v-if="statements.length > 0"
      :model-value="languages"
      :statements="statements"
      :errors="fieldErrors"
      @update:model-value="choose"
    />
    <p v-else class="text-sm text-muted">{{ $t('admin.polygonLink.panel.drawer.noLanguages') }}</p>
    <div class="flex flex-col gap-4 border-t border-line pt-4">
      <ImportCheckbox
        v-model="flags.ignoreZeroPointBatches"
        :label="$t('admin.polygon.form.ignoreBatches')"
        :description="$t('admin.polygon.form.ignoreBatchesHint')"
      />
      <ImportCheckbox
        v-model="flags.ignoreZeroPointCases"
        :label="$t('admin.polygon.form.ignoreCases')"
        :description="$t('admin.polygon.form.ignoreCasesHint')"
      />
      <ImportCheckbox
        v-model="flags.appendMainSolution"
        :label="$t('admin.polygon.form.appendSolution')"
        :description="$t('admin.polygon.form.appendSolutionHint')"
      />
    </div>
    <p class="text-meta text-muted">{{ $t('admin.polygonLink.panel.drawer.note') }}</p>
    <AdminStatus v-if="pageRefusal" kind="refused" :text="pageRefusal" />
    <template #footer>
      <AppButton @click="visible = false">
        {{ $t('admin.polygonLink.panel.drawer.cancel') }}
      </AppButton>
      <AppButton tone="primary" class="ml-auto" :loading="save.isPending.value" @click="submit">
        {{ $t('admin.polygonLink.panel.drawer.save') }}
      </AppButton>
    </template>
  </AdminDrawer>
</template>
