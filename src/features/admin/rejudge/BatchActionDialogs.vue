<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { RejudgeBody } from '@/api/types/submission-actions';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdminStatus from '../ui/AdminStatus.vue';
import AdminSubmissionTable from '../submissions/AdminSubmissionTable.vue';
import { queuedLinkQuery } from '../submissions/admin-submission-filters';
import RejudgeCountPanel from './RejudgeCountPanel.vue';
import { toRescoreBody } from './rejudge-filter';
import { useBulkRejudge } from './use-bulk-rejudge';
import type { RejudgeOutcome } from './use-bulk-rejudge';
import { canConfirmRescore, useBulkRescore } from './use-bulk-rescore';
import { canConfirmRejudge, useRejudgeCount } from './use-rejudge-count';

/**
 * The two batch confirms (rejudge, rescore) over one filter body: each opens by counting with a dry run and confirms only a
 * counted, permitted, non-empty batch. Used by the rejudge screen and by the admin submission list's bulk bar.
 */
const props = defineProps<{
  body: RejudgeBody;
  /** The filter in words, under the count. */
  line: string;
}>();
const emit = defineEmits<{ outcome: [outcome: RejudgeOutcome] }>();
const locale = useLocaleStore();
const isRejudgeOpen = ref(false);
const isRescoreOpen = ref(false);
const bulk = useBulkRejudge();
const rescorer = useBulkRescore();
const { state: countState, count: countMatching, reset: resetCount } = useRejudgeCount();

const sample = computed(() => (countState.value.kind === 'ready' ? countState.value.sample : []));
/** The button names what it will do: the counted number once known, "counting" while the server counts. */
const rejudgeLabel = computed(() => {
  const state = countState.value;
  if (state.kind === 'counting') return translate('admin.rejudge.confirm.labelCounting');
  if (state.kind === 'ready' && canConfirmRejudge(state))
    return translate('admin.rejudge.confirm.labelCount', {
      count: formatNumber(state.count, locale.locale),
    });
  return translate('admin.rejudge.confirm.labelPlain');
});
const rescoreLine = computed(() => {
  const preview = rescorer.preview.value;
  if (preview.kind === 'counting') return translate('admin.rejudge.confirm.count.countingText');
  if (preview.kind !== 'ready') return '';
  return translate('admin.rejudge.rescore.preview', { ...preview.result });
});

function open(action: 'rejudge' | 'rescore') {
  if (action === 'rejudge') {
    isRejudgeOpen.value = true;
    void countMatching(props.body);
  } else {
    isRescoreOpen.value = true;
    void rescorer.count(toRescoreBody(props.body));
  }
}
defineExpose({ open });
watch(isRejudgeOpen, (isOpen) => !isOpen && resetCount());
watch(isRescoreOpen, (isOpen) => !isOpen && rescorer.reset());

async function confirmRejudge() {
  await bulk.rejudge(props.body, queuedLinkQuery(props.body));
  isRejudgeOpen.value = false;
  if (bulk.outcome.value) emit('outcome', bulk.outcome.value);
}
async function confirmRescore() {
  await rescorer.rescore(toRescoreBody(props.body));
  isRescoreOpen.value = false;
  if (rescorer.outcome.value) emit('outcome', rescorer.outcome.value);
}
</script>

<template>
  <ConfirmDialog
    v-model:visible="isRejudgeOpen"
    tone="danger"
    :title="$t('admin.rejudge.confirm.title')"
    :confirm-label="rejudgeLabel"
    :busy="bulk.isPending.value"
    :can-confirm="canConfirmRejudge(countState)"
    :width="720"
    @confirm="confirmRejudge"
  >
    <RejudgeCountPanel :state="countState" />
    <p class="text-sm">{{ line }}</p>
    <div v-if="sample.length" class="flex flex-col gap-2">
      <p class="text-sm font-semibold">{{ $t('admin.rejudge.confirm.sample') }}</p>
      <AdminSubmissionTable :items="sample" :label="$t('admin.rejudge.confirm.sample')" />
    </div>
    <p class="text-sm text-muted">{{ $t('admin.rejudge.confirm.body') }}</p>
  </ConfirmDialog>
  <ConfirmDialog
    v-model:visible="isRescoreOpen"
    :title="$t('admin.rejudge.rescore.title')"
    :confirm-label="$t('admin.rejudge.rescore.confirm')"
    :busy="rescorer.isPending.value"
    :can-confirm="canConfirmRescore(rescorer.preview.value)"
    @confirm="confirmRescore"
  >
    <AdminStatus
      v-if="rescorer.preview.value.kind === 'failed'"
      kind="refused"
      :text="rescorer.preview.value.text"
    />
    <p v-else role="status" class="text-sm font-semibold">{{ rescoreLine }}</p>
    <p class="text-sm">{{ line }}</p>
    <p class="text-sm text-muted">{{ $t('admin.rejudge.rescore.body') }}</p>
  </ConfirmDialog>
</template>
