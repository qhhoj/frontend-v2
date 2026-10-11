<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue';
import { useRoute } from 'vue-router';
import { useProblemMetaQuery } from '@/features/problems/problems.queries';
import { translate } from '@/i18n';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import type { FieldErrors } from '../ui/admin-errors';
import BatchActionDialogs from './BatchActionDialogs.vue';
import RecentBatches from './RecentBatches.vue';
import RejudgeFilterForm from './RejudgeFilterForm.vue';
import RejudgeSummary from './RejudgeSummary.vue';
import {
  checkRejudgeFilter,
  describeRejudgeFilter,
  emptyRejudgeFilter,
  filterFromQuery,
  toRejudgeBody,
} from './rejudge-filter';
import type { RejudgeFilter } from './rejudge-filter';
import type { RejudgeOutcome } from './use-bulk-rejudge';

/** A link from a contest or a problem prefills the scope (`?contest=…&problem=…`). */
const filter = ref<RejudgeFilter>(filterFromQuery(useRoute().query));
const errors = ref<FieldErrors>({});
const outcome = ref<RejudgeOutcome | null>(null);
const dialogs = useTemplateRef('dialogs');
const metaQuery = useProblemMetaQuery();
const languages = computed(() => metaQuery.data.value?.languages ?? []);
const body = computed(() => toRejudgeBody(filter.value));
const confirmLine = computed(() => {
  const text = describeRejudgeFilter(filter.value, languages.value);
  return translate('admin.rejudge.confirm.line', { ...text });
});

/** A filter with errors opens no dialog and sends nothing; a good one opens the dialog, which counts at once (a dry run). */
function ask(action: 'rejudge' | 'rescore') {
  errors.value = checkRejudgeFilter(filter.value);
  if (Object.keys(errors.value).length === 0) dialogs.value?.open(action);
}

function resetFilter() {
  filter.value = emptyRejudgeFilter();
  errors.value = {};
}
</script>

<template>
  <div class="mx-auto flex max-w-[1280px] flex-col gap-6">
    <AdminPageHeader
      :crumbs="[
        { label: $t('admin.rejudge.crumbs.judging') },
        { label: $t('admin.shell.screens.rejudge') },
      ]"
      :title="$t('admin.shell.screens.rejudge')"
      :lead="$t('admin.rejudge.lead')"
    />
    <div class="grid gap-6 lg:grid-cols-2 lg:items-start">
      <RejudgeFilterForm
        v-model:filter="filter"
        :languages="languages"
        :errors="errors"
        @rejudge="ask('rejudge')"
        @rescore="ask('rescore')"
        @reset="resetFilter"
      />
      <div class="flex flex-col gap-6">
        <RejudgeSummary :filter="filter" :languages="languages" :outcome="outcome" />
        <RecentBatches />
      </div>
    </div>
    <BatchActionDialogs
      ref="dialogs"
      :body="body"
      :line="confirmLine"
      @outcome="(next) => (outcome = next)"
    />
  </div>
</template>
