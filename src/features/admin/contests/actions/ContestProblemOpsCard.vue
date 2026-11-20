<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { rescoreContestProblem } from '@/api/contest-admin.api';
import type { EditableContest } from '@/api/types/contest-editing';
import AppButton from '@/components/ui/AppButton.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { CARD, INPUT, buttonClass } from '../../ui/controls';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { CONTEST_TOOLS_ANCHORS } from '../workbench/contest-workbench-tabs';

/**
 * Rescore one saved problem of the contest: its contest submissions and the participations that sent one, without
 * judging again. Rejudging a problem is done with the contest's one rejudge form ("Khi kỳ thi diễn ra"); the card links
 * there.
 */
const props = defineProps<{ contest: EditableContest }>();
const route = useRoute();
const problems = computed(() => props.contest.problems ?? []);
const selectedCode = ref(problems.value[0]?.code ?? '');
const rescore = useAdminMutation({
  mutate: () => rescoreContestProblem(props.contest.key, selectedCode.value),
  invalidates: () => [['admin', 'contest-actions', props.contest.key]],
});
/** A save on this page can remove the selected problem or add the first one. */
watch(problems, (listed) => {
  if (!listed.some((entry) => entry.code === selectedCode.value))
    selectedCode.value = listed[0]?.code ?? '';
});
watch(selectedCode, () => rescore.reset());
const rejudgeTo = computed(() => ({
  name: route.name!,
  params: route.params,
  query: { tab: 'setup' },
  hash: `#${CONTEST_TOOLS_ANCHORS.rejudge}`,
}));
</script>

<template>
  <section data-testid="problem-ops" :class="[CARD, 'flex flex-col gap-3 p-5']">
    <h3 class="m-0 text-base font-semibold">
      {{ $t('admin.contestOps.problemOps.title') }}
    </h3>
    <p class="text-sm text-muted">{{ $t('admin.contestOps.problemOps.description') }}</p>
    <p v-if="problems.length === 0" class="text-sm text-muted">
      {{ $t('admin.contestOps.problemOps.noProblems') }}
    </p>
    <div v-else class="flex flex-wrap items-end gap-3">
      <div class="flex min-w-48 flex-1 flex-col gap-1.5 sm:max-w-sm">
        <label for="problem-ops-code" class="text-sm font-semibold">
          {{ $t('admin.contestOps.problemOps.problemLabel') }}
        </label>
        <select id="problem-ops-code" v-model="selectedCode" :class="INPUT">
          <option v-for="entry in problems" :key="entry.code" :value="entry.code">
            {{ entry.label }} · {{ entry.name }} ({{ entry.code }})
          </option>
        </select>
      </div>
      <button
        type="button"
        :class="buttonClass('secondary')"
        :aria-busy="rescore.isPending.value || undefined"
        @click="rescore.run(undefined)"
      >
        {{ $t('admin.contestOps.problemOps.rescore') }}
      </button>
    </div>
    <AppButton tone="link" class="self-start text-meta" :to="rejudgeTo">
      {{ $t('admin.contestOps.problemOps.toRejudge') }}
    </AppButton>
    <AdminStatus
      v-if="rescore.isDone.value"
      kind="queued"
      :text="$t('admin.contestOps.problemOps.rescoreQueued', { code: selectedCode })"
    />
    <AdminStatus
      v-if="rescore.failure.value"
      kind="refused"
      :text="failureTextOf(rescore.failure.value)"
    />
  </section>
</template>
