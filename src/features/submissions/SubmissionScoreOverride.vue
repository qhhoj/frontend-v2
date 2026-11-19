<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next';
import { useQueryClient } from '@tanstack/vue-query';
import { computed, ref, watch } from 'vue';
import { overrideSubmissionScore } from '@/api/submission-actions.api';
import type { OverrideResult } from '@/api/submission-actions.api';
import type { SubmissionDetail } from '@/api/types/submissions';
import AdminStatus from '@/features/admin/ui/AdminStatus.vue';
import { BUTTON, INPUT } from '@/features/admin/ui/controls';
import { failureTextOf } from '@/features/admin/ui/admin-errors';
import { useAdminMutation } from '@/features/admin/ui/use-admin-mutation';
import { useViewerId } from '@/stores/use-viewer-id';

/**
 * Sets a finished submission's verdict and points by hand (`PUT /submissions/{id}/score`). Folded until opened: it is rare.
 * The cases stay as judged; a rejudge discards the override unless the submission is locked with it.
 */
const RESULTS: readonly OverrideResult[] = ['AC', 'WA', 'TLE', 'MLE', 'OLE', 'RTE', 'IR'];
const COMMENT_MAX = 500;

const props = defineProps<{ submission: SubmissionDetail }>();
const maxPoints = computed(() => props.submission.problem?.points ?? 0);
const result = ref<OverrideResult>('AC');
const points = ref(0);
const comment = ref('');
const lock = ref(false);
/** The form starts from the stored verdict and score each time the row changes. */
watch(
  () => [props.submission.result, props.submission.points] as const,
  ([storedResult, storedPoints]) => {
    result.value = RESULTS.find((code) => code === storedResult) ?? 'AC';
    points.value = storedPoints ?? 0;
  },
  { immediate: true },
);
/** `AC` is full points: picking it fills them in. */
watch(result, (picked) => {
  if (picked === 'AC') points.value = maxPoints.value;
});

const queryClient = useQueryClient();
const viewerId = useViewerId();
const mutation = useAdminMutation<void, void>({
  mutate: () =>
    overrideSubmissionScore(props.submission.id, {
      result: result.value,
      points: points.value,
      comment: comment.value.trim(),
      lock: lock.value,
    }),
  onDone: () => {
    comment.value = '';
    void queryClient.invalidateQueries({
      queryKey: ['submissions', 'detail', viewerId.value, props.submission.id],
    });
  },
});
const canSave = computed(
  () => comment.value.trim() !== '' && Number.isFinite(points.value) && !mutation.isPending.value,
);
</script>

<template>
  <details class="group border-t border-line pt-2" data-testid="score-override">
    <summary class="flex min-h-11 cursor-pointer items-center gap-2 font-semibold">
      <ChevronRight
        aria-hidden="true"
        class="size-4 text-muted transition-transform group-open:rotate-90"
        :stroke-width="1.75"
      />
      {{ $t('admin.staff.override.title') }}
    </summary>
    <form class="flex flex-col gap-3 pt-2" @submit.prevent="canSave && mutation.run()">
      <p class="text-sm text-muted">{{ $t('admin.staff.override.lead') }}</p>
      <div class="flex flex-wrap gap-3">
        <label class="flex flex-col gap-1" for="override-result">
          {{ $t('admin.staff.override.result') }}
          <select id="override-result" v-model="result" :class="INPUT">
            <option v-for="code in RESULTS" :key="code" :value="code">{{ code }}</option>
          </select>
        </label>
        <label class="flex flex-col gap-1" for="override-points">
          {{ $t('admin.staff.override.points', { max: maxPoints }) }}
          <input
            id="override-points"
            v-model.number="points"
            type="number"
            min="0"
            :max="maxPoints"
            step="0.001"
            inputmode="decimal"
            :class="INPUT"
          />
        </label>
      </div>
      <label class="flex flex-col gap-1" for="override-comment">
        {{ $t('admin.staff.override.comment') }}
        <textarea
          id="override-comment"
          v-model="comment"
          required
          :maxlength="COMMENT_MAX"
          :class="[INPUT, 'min-h-24 resize-y py-2']"
        />
      </label>
      <label class="flex items-center gap-2">
        <input id="override-lock" v-model="lock" type="checkbox" class="size-5" />
        {{ $t('admin.staff.override.lock') }}
      </label>
      <div>
        <button
          type="submit"
          :class="BUTTON.primary"
          :aria-disabled="!canSave || undefined"
          :aria-busy="mutation.isPending.value || undefined"
        >
          {{ $t('admin.staff.override.save') }}
        </button>
      </div>
      <AdminStatus
        v-if="mutation.failure.value"
        kind="refused"
        :text="failureTextOf(mutation.failure.value)"
      />
      <AdminStatus
        v-else-if="mutation.isDone.value"
        kind="done"
        :text="$t('admin.staff.override.done')"
      />
    </form>
  </details>
</template>
