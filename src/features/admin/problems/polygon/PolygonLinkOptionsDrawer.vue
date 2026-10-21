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
import { repeatedLanguageErrors, repeatedLanguages } from './polygon-languages';
import { linkChoiceOf, linkOptionsBodyOf, linkStatementsOf } from './polygon-link-options';
import { optionsFieldOf, optionsRefusalOf } from './polygon-options-refusal';

/**
 * "Sửa" on the link panel (option C): the saved sync options in a 560 px drawer. The statements come from the saved
 * options and the last sync's failure (no preview without the link's token); the failure's own fix shows under its
 * field until the choice changes. Saving replaces the options for the next sync; the server checks them against Polygon.
 */
const props = defineProps<{ code: string; link: PolygonLink; error: ImportErrorText }>();
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ saved: [link: PolygonLink] }>();

const statements = computed(() =>
  linkStatementsOf(
    props.link.options,
    props.link.lastSyncErrorCode,
    props.link.lastSyncErrorParams,
  ),
);
const languages = ref(linkChoiceOf(props.link.options, statements.value));
const flags = ref({
  ignoreZeroPointBatches: props.link.options.ignoreZeroPointBatches,
  ignoreZeroPointCases: props.link.options.ignoreZeroPointCases,
  appendMainSolution: props.link.options.appendMainSolution,
});
const isChanged = ref(false);

const save = useAdminMutation({
  mutate: () => updatePolygonLink(props.code, linkOptionsBodyOf(languages.value, flags.value)),
  onSuccess: (link) => emit('saved', link),
});
const refusal = computed(() => optionsRefusalOf(save.failure.value));
watch(languages, () => {
  isChanged.value = true;
  if (refusal.value) save.reset();
});

/** The last sync's language failure under its field until the choice changes; the server's refusal of this save after. */
const fieldErrors = computed(() => {
  const errors = repeatedLanguageErrors(languages.value);
  if (refusal.value?.field) errors[refusal.value.field] = refusal.value.text;
  const { lastSyncErrorCode: failed, lastSyncErrorParams: params } = props.link;
  const field = failed ? optionsFieldOf(failed, params ?? {}) : null;
  if (!isChanged.value && field) errors[field] ??= props.error.fix;
  return errors;
});
const pageRefusal = computed(() => {
  if (!save.failure.value || refusal.value?.field) return null;
  return refusal.value?.text ?? importRefusalText(save.failure.value);
});
const submit = () => repeatedLanguages(languages.value).length === 0 && save.run(undefined);
</script>

<template>
  <AdminDrawer v-model:visible="visible" :title="$t('admin.polygonLink.panel.drawer.title')">
    <PolygonLanguageFields
      v-if="statements.length > 0"
      v-model="languages"
      :statements="statements"
      :errors="fieldErrors"
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
