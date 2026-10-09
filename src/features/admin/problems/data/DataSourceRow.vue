<script setup lang="ts">
import { ref } from 'vue';
import { deleteDataFile, problemDataFileUrl, uploadDataSource } from '@/api/problem-data.api';
import type { ProblemData, SourceFileKind } from '@/api/types/problem-data';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { ADMIN_DANGER_CLASS } from '../../ui/classes';
import UploadButton from '../../ui/UploadButton.vue';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { useKeepDataAnswer } from './problem-data.queries';

const props = defineProps<{
  code: string;
  kind: SourceFileKind;
  label: string;
  storedName: string | null;
}>();
const keepAnswer = useKeepDataAnswer(() => props.code);
const isConfirmShown = ref(false);

const upload = useAdminMutation({
  mutate: (file: File) => uploadDataSource(props.code, props.kind, file),
  onDone: keepAnswer,
});
const remove = useAdminMutation({
  mutate: (kind: SourceFileKind) => deleteDataFile(props.code, kind),
  onDone: (saved: ProblemData) => {
    keepAnswer(saved);
    isConfirmShown.value = false;
  },
});
</script>

<template>
  <div
    :data-testid="`source-${kind}`"
    class="flex flex-col gap-2 border-b border-line py-3 sm:flex-row sm:items-center sm:justify-between"
  >
    <div class="flex flex-col">
      <p class="font-semibold">{{ label }}</p>
      <p class="text-sm">
        <a
          v-if="storedName"
          :href="problemDataFileUrl(code, storedName)"
          class="font-mono text-accent-text underline"
          >{{ storedName }}</a
        >
        <span v-else class="text-muted">{{ $t('admin.problems.uploads.sources.none') }}</span>
      </p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <UploadButton
        :label="
          storedName
            ? $t('admin.problems.uploads.sources.replace')
            : $t('admin.problems.uploads.sources.upload')
        "
        :is-pending="upload.isPending.value"
        @picked="upload.run"
      />
      <button
        v-if="storedName"
        type="button"
        :class="ADMIN_DANGER_CLASS"
        :aria-label="$t('admin.problems.uploads.sources.remove', { name: storedName })"
        @click="isConfirmShown = true"
      >
        {{ $t('admin.problems.uploads.sources.removeConfirm') }}
      </button>
    </div>
    <AdminStatus
      v-if="upload.failure.value"
      kind="refused"
      :text="failureTextOf(upload.failure.value)"
    />
    <ConfirmDialog
      v-model:visible="isConfirmShown"
      :title="$t('admin.problems.uploads.sources.removeTitle', { name: storedName ?? '' })"
      :body="$t('admin.problems.uploads.sources.removeBody')"
      :confirm-label="$t('admin.problems.uploads.sources.removeConfirm')"
      tone="danger"
      :busy="remove.isPending.value"
      @confirm="remove.run(kind)"
    >
      <template #error>
        <AdminStatus
          v-if="remove.failure.value"
          kind="refused"
          :text="failureTextOf(remove.failure.value)"
        />
      </template>
    </ConfirmDialog>
  </div>
</template>
