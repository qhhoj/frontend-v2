<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { setProblemsVisibility } from '@/api/admin-index.api';
import type { BulkVisibilityResult } from '@/api/types/problems';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { usePermissions } from '@/stores/use-permissions';
import { failureTextOf } from '../ui/admin-errors';
import { ADMIN_INPUT_CLASS } from '../ui/classes';
import { useAdminMutation } from '../ui/use-admin-mutation';
import { PROBLEM_INDEX_KEY, PUBLIC_PROBLEMS_KEY } from '../problems/problem-editing.queries';

/** Confirms publishing (`isPublic`) or unpublishing `codes`; `done` hands the per-code results to the list. */
const props = defineProps<{ codes: string[]; isPublic: boolean }>();
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ done: [result: BulkVisibilityResult] }>();
const { can } = usePermissions();
/** The publication date is a `judge.edit_all_problem` field: without it the backend refuses every problem. */
const canSetDate = computed(() => props.isPublic && can('judge.edit_all_problem'));
const changeMessage = ref('');
const setDateToNow = ref(true);
watch(visible, (isOpen) => {
  if (!isOpen) return;
  changeMessage.value = '';
  setDateToNow.value = true;
  mutation.reset();
});

const mutation = useAdminMutation({
  mutate: () =>
    setProblemsVisibility({
      codes: props.codes,
      isPublic: props.isPublic,
      setDateToNow: canSetDate.value && setDateToNow.value,
      changeMessage: changeMessage.value.trim() || undefined,
    }),
  invalidates: () => [PROBLEM_INDEX_KEY, PUBLIC_PROBLEMS_KEY],
  onDone: (result) => {
    visible.value = false;
    emit('done', result);
  },
});
const verb = computed(() => (props.isPublic ? 'publish' : 'unpublish'));
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    :title="$t(`admin.problemList.bulk.${verb}Title`, { count: codes.length }, codes.length)"
    :confirm-label="$t(`admin.problemList.bulk.${verb}Confirm`)"
    :tone="isPublic ? 'neutral' : 'danger'"
    :busy="mutation.isPending.value"
    :width="520"
    @confirm="mutation.run(undefined)"
  >
    <div class="flex flex-col gap-4 text-sm">
      <p>{{ $t(`admin.problemList.bulk.${verb}Body`) }}</p>
      <p class="font-mono text-xs break-words text-muted">{{ codes.join(', ') }}</p>
      <label v-if="canSetDate" class="flex min-h-11 items-center gap-3">
        <input v-model="setDateToNow" type="checkbox" class="size-5" />
        {{ $t('admin.problemList.bulk.setDateToNow') }}
      </label>
      <label class="flex flex-col gap-1.5 font-semibold">
        {{ $t('admin.problemList.bulk.changeMessage') }}
        <input
          v-model="changeMessage"
          type="text"
          maxlength="500"
          :placeholder="$t('admin.problemList.bulk.changeMessagePlaceholder')"
          :class="ADMIN_INPUT_CLASS"
        />
      </label>
    </div>
    <template #error>
      <p v-if="mutation.failure.value" role="alert" class="text-sm text-negative">
        {{ failureTextOf(mutation.failure.value) }}
      </p>
    </template>
  </ConfirmDialog>
</template>
