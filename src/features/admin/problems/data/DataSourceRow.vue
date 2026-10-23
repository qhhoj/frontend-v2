<script setup lang="ts">
import { ref } from 'vue';
import { deleteDataFile, problemDataFileUrl } from '@/api/problem-data.api';
import type { ProblemData, SourceFileKind } from '@/api/types/problem-data';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureReasonOf } from '../failure-reason';
import { Trash2 } from 'lucide-vue-next';
import { iconButtonClass } from '../../ui/controls';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { useKeepDataAnswer } from './problem-data.queries';

/** A stored source file of the problem, with its delete button: the judge does not grade init.yml generators, so none can be uploaded. */
const props = defineProps<{
  code: string;
  kind: SourceFileKind;
  label: string;
  storedName: string | null;
}>();
const keepAnswer = useKeepDataAnswer(() => props.code);
const isConfirmShown = ref(false);

const remove = useAdminMutation({
  mutate: (kind: SourceFileKind) => deleteDataFile(props.code, kind),
  onDone: (saved: ProblemData) => {
    keepAnswer(saved);
    isConfirmShown.value = false;
  },
});
</script>

<template>
  <li
    :data-testid="`source-${kind}`"
    class="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
  >
    <div class="min-w-0 flex-1">
      <p class="text-sm font-semibold">{{ label }}</p>
      <p class="truncate text-sm">
        <a
          v-if="storedName"
          :href="problemDataFileUrl(code, storedName)"
          class="font-mono text-accent-text hover:underline"
          >{{ storedName }}</a
        >
        <span v-else class="text-muted">{{ $t('admin.problems.uploads.sources.none') }}</span>
      </p>
    </div>
    <div class="flex items-center gap-1">
      <button
        v-if="storedName"
        type="button"
        :class="[iconButtonClass('ghost'), 'text-negative']"
        :aria-label="$t('admin.problems.uploads.sources.remove', { name: storedName })"
        :title="$t('admin.problems.uploads.sources.remove', { name: storedName })"
        @click="isConfirmShown = true"
      >
        <Trash2 aria-hidden="true" class="size-4" :stroke-width="1.75" />
      </button>
    </div>
    <ConfirmDialog
      v-model:visible="isConfirmShown"
      :title="$t('admin.problems.uploads.sources.removeTitle', { name: storedName ?? '' })"
      :body="$t('admin.problems.uploads.sources.removeBody')"
      tone="danger"
      :busy="remove.isPending.value"
      @confirm="remove.run(kind)"
    >
      <template #error>
        <AdminStatus
          v-if="remove.failure.value"
          kind="refused"
          :text="failureReasonOf(remove.failure.value)"
        />
      </template>
    </ConfirmDialog>
  </li>
</template>
