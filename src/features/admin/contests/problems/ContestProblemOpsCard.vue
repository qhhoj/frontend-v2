<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { rejudgeContestProblem, rescoreContestProblem } from '@/api/contest-admin.api';
import type { EditableContest } from '@/api/types/contest-editing';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { usePermissions } from '@/stores/use-permissions';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { ADMIN_BUTTON_CLASS, ADMIN_DANGER_CLASS, ADMIN_INPUT_CLASS } from '../../ui/classes';
import { useAdminMutation } from '../../ui/use-admin-mutation';

/**
 * Rejudge or rescore one saved problem of the contest. The rejudge dialog first counts the matching submissions (a dry
 * run), so the editor sees how many will be queued and whether the bulk limit allows it, before confirming.
 */
const props = defineProps<{ contest: EditableContest }>();
const locale = useLocaleStore();
const { can } = usePermissions();
const problems = computed(() => props.contest.problems ?? []);
const selectedCode = ref(problems.value[0]?.code ?? '');
const includeLocked = ref(false);
const isRejudgeOpen = ref(false);
const canRejudge = computed(() => can('judge.rejudge_submission'));
const selected = computed(() => problems.value.find((entry) => entry.code === selectedCode.value));

/** The last dry run's answer: how many would be queued and whether the bulk limit lets this editor do it. */
const lastPreview = ref<{ count: number; allowed: boolean } | null>(null);
const rejudgedCount = ref(0);
const preview = useAdminMutation({
  mutate: () =>
    rejudgeContestProblem(props.contest.key, selectedCode.value, {
      dryRun: true,
      force: includeLocked.value,
    }),
  onSuccess: (result) => {
    lastPreview.value = result;
  },
});
const rejudge = useAdminMutation({
  mutate: () =>
    rejudgeContestProblem(props.contest.key, selectedCode.value, { force: includeLocked.value }),
  invalidates: () => [['submissions']],
  onSuccess: (result) => {
    rejudgedCount.value = result.count;
  },
  onDone: () => {
    isRejudgeOpen.value = false;
  },
});
const canConfirmRejudge = computed(
  () => !preview.isPending.value && (lastPreview.value?.allowed ?? false),
);
const rescore = useAdminMutation({
  mutate: () => rescoreContestProblem(props.contest.key, selectedCode.value),
  invalidates: () => [['admin', 'contest-actions', props.contest.key]],
});

/** A dry run per open dialog, and again when the editor toggles locked submissions. */
function openRejudge() {
  rejudge.reset();
  lastPreview.value = null;
  isRejudgeOpen.value = true;
  void preview.run(undefined);
}
watch(includeLocked, () => isRejudgeOpen.value && void preview.run(undefined));
watch(selectedCode, () => {
  rejudge.reset();
  rescore.reset();
});

const count = (value: number) => formatNumber(value, locale.locale);
</script>

<template>
  <section data-testid="problem-ops" class="glass flex flex-col gap-3 rounded-panel p-5">
    <h3 class="font-display text-lg font-semibold">
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
        <select id="problem-ops-code" v-model="selectedCode" :class="ADMIN_INPUT_CLASS">
          <option v-for="entry in problems" :key="entry.code" :value="entry.code">
            {{ entry.label }} · {{ entry.name }} ({{ entry.code }})
          </option>
        </select>
      </div>
      <button
        type="button"
        :class="ADMIN_BUTTON_CLASS"
        :aria-busy="rescore.isPending.value || undefined"
        @click="rescore.run(undefined)"
      >
        {{ $t('admin.contestOps.problemOps.rescore') }}
      </button>
      <button v-if="canRejudge" type="button" :class="ADMIN_DANGER_CLASS" @click="openRejudge">
        {{ $t('admin.contestOps.problemOps.rejudge') }}
      </button>
    </div>
    <p v-if="problems.length && !canRejudge" class="text-sm text-muted">
      {{ $t('admin.ui.needsPermission', { permission: 'judge.rejudge_submission' }) }}
    </p>
    <AdminStatus
      v-if="rescore.isDone.value"
      kind="queued"
      :text="$t('admin.contestOps.problemOps.rescoreQueued', { code: selectedCode })"
    />
    <AdminStatus
      v-if="rejudge.isDone.value"
      kind="done"
      :text="
        $t('admin.contestOps.problemOps.rejudged', {
          count: count(rejudgedCount),
          code: selectedCode,
        })
      "
    />
    <AdminStatus
      v-if="rescore.failure.value"
      kind="refused"
      :text="failureTextOf(rescore.failure.value)"
    />

    <ConfirmDialog
      v-model:visible="isRejudgeOpen"
      :title="$t('admin.contestOps.problemOps.rejudgeTitle', { label: selected?.label ?? '' })"
      :confirm-label="$t('admin.contestOps.problemOps.rejudgeConfirm')"
      tone="danger"
      :busy="rejudge.isPending.value"
      :can-confirm="canConfirmRejudge"
      @confirm="rejudge.run(undefined)"
    >
      <p class="text-muted" aria-live="polite">
        <template v-if="preview.isPending.value">
          {{ $t('admin.contestOps.problemOps.counting') }}
        </template>
        <template v-else-if="lastPreview">
          {{
            $t('admin.contestOps.problemOps.willRejudge', {
              count: count(lastPreview.count),
              code: selectedCode,
            })
          }}
        </template>
      </p>
      <p v-if="lastPreview && !lastPreview.allowed" class="text-sm text-negative">
        {{ $t('admin.ui.needsPermission', { permission: 'judge.rejudge_submission_lot' }) }}
      </p>
      <label class="flex min-h-11 items-center gap-2 text-sm">
        <input v-model="includeLocked" type="checkbox" class="size-5" />
        {{ $t('admin.contestOps.problemOps.includeLocked') }}
      </label>
      <template #error>
        <p
          v-if="rejudge.failure.value || preview.failure.value"
          role="alert"
          class="text-sm text-negative"
        >
          {{ failureTextOf((rejudge.failure.value ?? preview.failure.value)!) }}
        </p>
      </template>
    </ConfirmDialog>
  </section>
</template>
