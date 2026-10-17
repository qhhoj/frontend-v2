<script setup lang="ts">
import { computed } from 'vue';
import type { EditableContest } from '@/api/types/contest-editing';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf } from '../../ui/admin-errors';
import AdminNotice from '../../ui/feedback/AdminNotice.vue';
import AdminLeaveGuard from '../../ui/form/AdminLeaveGuard.vue';
import AdminSaveBar from '../../ui/form/AdminSaveBar.vue';
import { useEditorView } from '../../ui/form/use-editor-view';
import { rescoresOn } from '../contest-admin';
import ContestGeneralForm from './ContestGeneralForm.vue';
import ContestSummaryRail from './ContestSummaryRail.vue';
import { CONTEST_BASIC_FIELDS } from './contest-views';
import { useContestForm } from './use-contest-form';

/** The general tab: the form card, the summary (a strip above it, a rail from 1280 px), and the save bar with its leave guard. */
const props = defineProps<{ contest: EditableContest }>();
const { form, seed, errors, dirtyCount, savedAt, pendingPatch, save, discard, mutation } =
  useContestForm(() => props.contest);
const { view, errorViews, revealErrors } = useEditorView(() => errors.value, CONTEST_BASIC_FIELDS);
/** One save for both views; a refusal in the view out of sight brings that view up. */
async function submit() {
  await save();
  await revealErrors();
}
/** The save will queue a rescore of every participation (the backend's scoring fields changed). */
const willRescore = computed(() => rescoresOn(pendingPatch.value));
const hasCodes = computed(() => ({
  access: props.contest.requiresAccessCode,
  ranking: props.contest.settings?.hasRankingAccessCode ?? false,
}));
/** The refusal's summary sits above the save bar; field errors also sit under their fields. */
const pageFailure = computed(() =>
  mutation.failure.value ? failureTextOf(mutation.failure.value) : null,
);
</script>

<template>
  <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_15rem] xl:items-start">
      <ContestSummaryRail
        :contest="contest"
        :has-sections="view === 'advanced'"
        class="xl:order-last"
      />
      <fieldset :disabled="mutation.isPending.value" class="m-0 min-w-0 border-0 p-0">
        <ContestGeneralForm
          v-model="form"
          :errors="errors"
          :is-create="false"
          :has-codes="hasCodes"
          :view="view"
          :error-views="errorViews"
          :saved="seed"
          has-rail
        />
        <p v-if="view === 'basic'" class="mt-3 text-sm" data-testid="contest-basic-problems">
          {{
            $t('admin.contests.general.basic.problems', { count: contest.problems?.length ?? 0 })
          }}
          <RouterLink
            :to="{ name: 'admin-contestProblems', params: { key: contest.key } }"
            class="font-semibold text-accent-text hover:underline"
            >{{ $t('admin.contests.general.basic.problemsLink') }}</RouterLink
          >
        </p>
      </fieldset>
    </div>
    <AdminNotice
      v-if="willRescore"
      tone="caution"
      :title="$t('admin.contestOps.general.rescoreTitle')"
      :summary="$t('admin.contestOps.general.rescoreNotice')"
    />
    <AdminStatus v-if="pageFailure" kind="refused" :text="pageFailure" />
    <AdminSaveBar
      :dirty-count="dirtyCount"
      :pending="mutation.isPending.value"
      :saved-at="savedAt"
      @discard="discard"
    />
    <AdminLeaveGuard :dirty-count="dirtyCount" />
  </form>
</template>
