<script setup lang="ts">
import { ref } from 'vue';
import { prepareContestData } from '@/api/contest-editing.api';
import type { PrepareDataBody } from '@/api/types/contest-editing';
import { SUBMISSION_RESULT_CODES } from '@/api/types/submissions';
import type { SubmissionResult } from '@/api/types/submissions';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { INPUT } from '../../ui/controls';
import { useAdminMutation } from '../../ui/use-admin-mutation';

/** Asks for a problem glob and result filters, then queues the export; empty fields are left out of the body. */
const props = defineProps<{ contestKey: string }>();
const visible = defineModel<boolean>('visible', { required: true });
const glob = ref('');
const results = ref<SubmissionResult[]>([]);

const mutation = useAdminMutation({
  mutate: (body: PrepareDataBody) => prepareContestData(props.contestKey, body),
  invalidates: () => [['admin', 'contest-data', props.contestKey]],
  onDone: () => {
    visible.value = false;
  },
});

function submit() {
  const problemGlob = glob.value.trim();
  void mutation.run({
    ...(problemGlob ? { problemGlob } : {}),
    ...(results.value.length > 0 ? { results: [...results.value] } : {}),
  });
}
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    :title="$t('admin.contests.actions.data.prepareTitle')"
    :confirm-label="$t('admin.contests.actions.data.prepareConfirm')"
    :busy="mutation.isPending.value"
    @confirm="submit"
  >
    <div class="flex flex-col gap-2">
      <label for="prepare-glob" class="text-sm font-semibold">{{
        $t('admin.contests.actions.data.globLabel')
      }}</label>
      <input
        id="prepare-glob"
        v-model="glob"
        :class="INPUT"
        aria-describedby="prepare-glob-hint"
        autocomplete="off"
      />
      <p id="prepare-glob-hint" class="text-xs text-muted">
        {{ $t('admin.contests.actions.data.globHint') }}
      </p>
    </div>
    <fieldset class="flex flex-col gap-2">
      <legend class="text-sm font-semibold">
        {{ $t('admin.contests.actions.data.resultsLegend') }}
      </legend>
      <p class="text-xs text-muted">{{ $t('admin.contests.actions.data.resultsHint') }}</p>
      <div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
        <label
          v-for="code in SUBMISSION_RESULT_CODES"
          :key="code"
          class="flex min-h-11 items-center gap-2 text-sm"
        >
          <input v-model="results" type="checkbox" :value="code" />{{ code }}
        </label>
      </div>
    </fieldset>
    <template #error>
      <p v-if="mutation.failure.value" role="alert" class="text-sm text-negative">
        {{ failureTextOf(mutation.failure.value) }}
      </p>
    </template>
  </ConfirmDialog>
</template>
