<script setup lang="ts">
import { computed } from 'vue';
import { failureTextOf } from '../../ui/admin-errors';
import AdminStatus from '../../ui/AdminStatus.vue';
import { ADMIN_PRIMARY_CLASS } from '../../ui/classes';
import type { EditableContest } from '@/api/types/contest-editing';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import DraftLeaveDialog from '../../problems/drafts/DraftLeaveDialog.vue';
import { useDraftLeaveGuard } from '../../problems/drafts/use-draft-leave-guard';
import { rescoresOn } from '../contest-admin';
import ContestGeneralForm from './ContestGeneralForm.vue';
import { useContestForm } from './use-contest-form';

const props = defineProps<{ contest: EditableContest }>();
const locale = useLocaleStore();
const { form, errors, isDirty, pendingPatch, save, mutation } = useContestForm(() => props.contest);
const { isLeaveOpen, leaveAnyway } = useDraftLeaveGuard(() => isDirty.value);
/** The save will queue a rescore of every participation (the backend's scoring fields changed). */
const willRescore = computed(() => rescoresOn(pendingPatch.value));
const hasCodes = computed(() => ({
  access: props.contest.requiresAccessCode,
  ranking: props.contest.settings?.hasRankingAccessCode ?? false,
}));
</script>

<template>
  <form class="flex flex-col gap-6" @submit.prevent="save">
    <fieldset
      :disabled="mutation.isPending.value"
      class="m-0 flex min-w-0 flex-col gap-6 border-0 p-0"
    >
      <ContestGeneralForm
        v-model="form"
        :errors="errors"
        :is-create="false"
        :has-codes="hasCodes"
      />
    </fieldset>
    <div
      class="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-line bg-surface-solid py-3"
    >
      <p v-if="willRescore" class="basis-full text-sm text-muted">
        {{
          $t('admin.contestOps.general.rescoreNotice', {
            count: formatNumber(contest.userCount + contest.virtualCount, locale.locale),
          })
        }}
      </p>
      <button type="submit" :class="ADMIN_PRIMARY_CLASS" :aria-disabled="!isDirty || undefined">
        {{ $t('admin.ui.save') }}
      </button>
      <AdminStatus v-if="mutation.isDone.value" kind="done" :text="$t('admin.ui.saved')" />
      <AdminStatus
        v-if="mutation.failure.value"
        kind="refused"
        :text="failureTextOf(mutation.failure.value)"
      />
    </div>
    <DraftLeaveDialog v-model:visible="isLeaveOpen" @leave="leaveAnyway" />
  </form>
</template>
