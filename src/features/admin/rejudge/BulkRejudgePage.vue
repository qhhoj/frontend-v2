<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { useProblemMetaQuery } from '@/features/problems/problems.queries';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import type { FieldErrors } from '../ui/admin-errors';
import RejudgeCountPanel from './RejudgeCountPanel.vue';
import RejudgeFilterForm from './RejudgeFilterForm.vue';
import RejudgeSummary from './RejudgeSummary.vue';
import {
  checkRejudgeFilter,
  describeRejudgeFilter,
  emptyRejudgeFilter,
  toRejudgeBody,
} from './rejudge-filter';
import type { RejudgeFilter } from './rejudge-filter';
import { useBulkRejudge } from './use-bulk-rejudge';
import { canConfirmRejudge, useRejudgeCount } from './use-rejudge-count';

const filter = ref<RejudgeFilter>(emptyRejudgeFilter());
const errors = ref<FieldErrors>({});
const isConfirmOpen = ref(false);
const locale = useLocaleStore();
const metaQuery = useProblemMetaQuery();
const languages = computed(() => metaQuery.data.value?.languages ?? []);
const { rejudge, outcome, isPending } = useBulkRejudge();
const { state: countState, count: countMatching, reset: resetCount } = useRejudgeCount();
const confirmTitle = computed(() =>
  translate('admin.rejudge.confirm.title', { problem: filter.value.problem.trim() }),
);
const confirmLine = computed(() => {
  const text = describeRejudgeFilter(filter.value, languages.value);
  return translate('admin.rejudge.confirm.line', {
    problem: text.problem,
    languages: text.languages,
    results: text.results,
    from: filter.value.idFrom.trim() ? text.from : translate('admin.rejudge.confirm.fromStart'),
    locked: text.locked,
  });
});
/** The button names what it will do: the counted number once known, "counting" while the server counts. */
const confirmLabel = computed(() => {
  const state = countState.value;
  if (state.kind === 'counting') return translate('admin.rejudge.confirm.labelCounting');
  if (state.kind === 'ready' && canConfirmRejudge(state))
    return translate('admin.rejudge.confirm.labelCount', {
      count: formatNumber(state.count, locale.locale),
    });
  return translate('admin.rejudge.confirm.labelPlain');
});

/** A filter with errors opens no dialog and sends nothing; a good one opens the dialog, which counts at once (a dry run). */
function askToConfirm() {
  errors.value = checkRejudgeFilter(filter.value);
  if (Object.keys(errors.value).length > 0) return;
  isConfirmOpen.value = true;
  void countMatching(toRejudgeBody(filter.value));
}
watch(isConfirmOpen, (isOpen) => {
  if (!isOpen) resetCount();
});

async function confirmRejudge() {
  await rejudge(toRejudgeBody(filter.value));
  isConfirmOpen.value = false;
}

function resetFilter() {
  filter.value = emptyRejudgeFilter();
  errors.value = {};
}
</script>

<template>
  <div class="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 py-6 sm:px-8">
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
        @rejudge="askToConfirm"
        @reset="resetFilter"
      />
      <RejudgeSummary :filter="filter" :languages="languages" :outcome="outcome" />
    </div>

    <ConfirmDialog
      v-model:visible="isConfirmOpen"
      tone="danger"
      :title="confirmTitle"
      :confirm-label="confirmLabel"
      :busy="isPending"
      :can-confirm="canConfirmRejudge(countState)"
      @confirm="confirmRejudge"
    >
      <RejudgeCountPanel :state="countState" />
      <p class="text-sm">{{ confirmLine }}</p>
      <p class="text-sm text-muted">{{ $t('admin.rejudge.confirm.body') }}</p>
    </ConfirmDialog>
  </div>
</template>
