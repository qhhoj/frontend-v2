<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { RejudgeBody } from '@/api/types/submission-actions';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdminStatus from '../ui/AdminStatus.vue';
import SubmissionTable from '@/features/submissions/SubmissionTable.vue';
import RejudgeCountPanel from './RejudgeCountPanel.vue';
import { toRescoreBody } from './rejudge-filter';
import type { RejudgeOutcome } from './use-bulk-rejudge';
import { canConfirmRescore, useBulkRescore } from './use-bulk-rescore';
import { useRejudgeConfirm } from './use-rejudge-confirm';
import { canConfirmRejudge } from './use-rejudge-count';

/**
 * The two batch confirms (rejudge, rescore) over one filter body: each opens by counting with a dry run and confirms only a
 * counted, permitted, non-empty batch. The one rejudge dialog: the rejudge screen, the admin submission list's bulk bar and
 * the contest workbench all open it. The body is copied when the dialog opens, so the request sent is the one counted.
 */
const props = defineProps<{
  body: RejudgeBody;
  /** The filter in words, under the count. */
  line: string;
  /** What a rescore of this body reaches beyond the matched rows (a contest scope recomputes the whole contest). */
  rescoreNote?: string;
}>();
const emit = defineEmits<{ outcome: [outcome: RejudgeOutcome] }>();
const locale = useLocaleStore();
const isRejudgeOpen = ref(false);
const isRescoreOpen = ref(false);
const rejudger = useRejudgeConfirm();
const rescorer = useBulkRescore();
const countState = rejudger.state;
/** The rescore body as it was when its dialog opened. */
const rescoreAsked = ref<RejudgeBody>({});
/** Whether the open rejudge also takes locked submissions: the skipped-rows line says which rule applies. */
const isForced = ref(false);

const sample = computed(() => (countState.value.kind === 'ready' ? countState.value.sample : []));
/** The button names what it will do: the counted number once known, "counting" while the server counts. */
const rejudgeLabel = computed(() => {
  const state = countState.value;
  if (state.kind === 'counting') return translate('admin.rejudge.confirm.labelCounting');
  if (state.kind === 'ready' && canConfirmRejudge(state))
    return translate('admin.rejudge.confirm.labelCount', {
      count: formatNumber(state.count, locale.locale),
    });
  return translate('common.rejudge');
});
const rescoreLine = computed(() => {
  const preview = rescorer.preview.value;
  if (preview.kind === 'counting') return translate('admin.rejudge.confirm.count.countingText');
  if (preview.kind !== 'ready') return '';
  return translate('admin.rejudge.rescore.preview', { ...preview.result });
});

function open(action: 'rejudge' | 'rescore') {
  if (action === 'rejudge') {
    isForced.value = props.body.force === true;
    isRejudgeOpen.value = true;
    void rejudger.ask(props.body);
  } else {
    rescoreAsked.value = JSON.parse(JSON.stringify(toRescoreBody(props.body))) as RejudgeBody;
    isRescoreOpen.value = true;
    void rescorer.count(rescoreAsked.value);
  }
}
defineExpose({ open });
watch(isRejudgeOpen, (isOpen) => !isOpen && rejudger.close());
watch(isRescoreOpen, (isOpen) => !isOpen && rescorer.reset());

async function confirmRejudge() {
  const outcome = await rejudger.confirm();
  isRejudgeOpen.value = false;
  if (outcome) emit('outcome', outcome);
}
async function confirmRescore() {
  await rescorer.rescore(rescoreAsked.value);
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
    :busy="rejudger.isPending.value"
    :can-confirm="canConfirmRejudge(countState)"
    size="lg"
    @confirm="confirmRejudge"
  >
    <RejudgeCountPanel :state="countState" />
    <p class="text-sm">{{ line }}</p>
    <div v-if="sample.length" class="flex flex-col gap-2">
      <p class="text-sm font-semibold">{{ $t('admin.rejudge.confirm.sample') }}</p>
      <SubmissionTable :submissions="sample" variant="surface" />
    </div>
    <p class="text-sm" data-testid="rejudge-skipped">
      {{ $t(`admin.rejudge.confirm.skipped.${isForced ? 'forced' : 'locked'}`) }}
    </p>
    <p class="text-sm text-muted">{{ $t('admin.rejudge.confirm.body') }}</p>
  </ConfirmDialog>
  <ConfirmDialog
    v-model:visible="isRescoreOpen"
    :title="$t('admin.rejudge.rescore.title')"
    :confirm-label="$t('common.rescore')"
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
    <p v-if="rescoreNote" class="text-sm font-semibold">{{ rescoreNote }}</p>
    <p class="text-sm text-muted">{{ $t('admin.rejudge.rescore.body') }}</p>
  </ConfirmDialog>
</template>
