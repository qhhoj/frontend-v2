<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { computed, ref, watch } from 'vue';
import { overrideSubmissionScore } from '@/api/submission-actions.api';
import type { OverrideResult } from '@/api/submission-actions.api';
import type { SubmissionDetail } from '@/api/types/submissions';
import AppButton from '@/components/ui/AppButton.vue';
import Checkbox from '@/components/ui/Checkbox.vue';
import Disclosure from '@/components/ui/Disclosure.vue';
import FormField from '@/components/ui/FormField.vue';
import SelectField from '@/components/ui/SelectField.vue';
import TextArea from '@/components/ui/TextArea.vue';
import TextInput from '@/components/ui/TextInput.vue';
import AdminStatus from '@/features/admin/ui/AdminStatus.vue';
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
/** A string, as the select hands it back; it only ever holds one of `RESULTS`. */
const result = ref<string>('AC');
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
      result: result.value as OverrideResult,
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
const canSave = computed(() => comment.value.trim() !== '' && Number.isFinite(points.value));
/** The points field holds a number; `TextInput` hands back what was typed. */
const pointsText = computed({
  get: () => String(points.value),
  set: (typed: string | number) => (points.value = Number(typed)),
});
</script>

<template>
  <Disclosure :label="$t('admin.staff.override.title')" data-testid="score-override">
    <form class="flex flex-col gap-3" @submit.prevent="canSave && mutation.run()">
      <p class="text-sm text-muted">{{ $t('admin.staff.override.lead') }}</p>
      <div class="flex flex-wrap gap-3">
        <FormField :label="$t('admin.staff.override.result')">
          <SelectField v-model="result">
            <option v-for="code in RESULTS" :key="code" :value="code">{{ code }}</option>
          </SelectField>
        </FormField>
        <FormField :label="$t('admin.staff.override.points', { max: maxPoints })">
          <TextInput
            v-model="pointsText"
            type="number"
            min="0"
            :max="maxPoints"
            step="0.001"
            inputmode="decimal"
          />
        </FormField>
      </div>
      <FormField :label="$t('admin.staff.override.comment')" required>
        <TextArea v-model="comment" :maxlength="COMMENT_MAX" />
      </FormField>
      <Checkbox v-model="lock" :label="$t('admin.staff.override.lock')" />
      <div>
        <AppButton
          type="submit"
          tone="primary"
          :loading="mutation.isPending.value"
          :disabled="!canSave"
          :disabled-reason="canSave ? undefined : $t('admin.staff.override.needsReason')"
        >
          {{ $t('admin.staff.override.save') }}
        </AppButton>
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
  </Disclosure>
</template>
