<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';
import { lockSubmission, unlockSubmission } from '@/api/submission-actions.api';
import type { SubmissionDetail } from '@/api/types/submissions';
import AdminStatus from '@/features/admin/ui/AdminStatus.vue';
import { BUTTON } from '@/features/admin/ui/controls';
import { failureTextOf } from '@/features/admin/ui/admin-errors';
import { useAdminMutation } from '@/features/admin/ui/use-admin-mutation';
import { useViewerId } from '@/stores/use-viewer-id';

/**
 * Legacy `locked_after`: a lock keeps a finished submission out of rejudges; unlocking (also a contest's scheduled lock) lets it
 * be rejudged. Any lock, current or scheduled, offers Unlock, so the button never depends on the client's clock. Reversible, so no confirm.
 */
const props = defineProps<{ submission: SubmissionDetail }>();
const isLocked = computed(() => props.submission.lockedAfter !== null);
const queryClient = useQueryClient();
const viewerId = useViewerId();
const mutation = useAdminMutation<boolean, void>({
  mutate: (locked) => (locked ? lockSubmission : unlockSubmission)(props.submission.id),
  onDone: () =>
    void queryClient.invalidateQueries({
      queryKey: ['submissions', 'detail', viewerId.value, props.submission.id],
    }),
});
const label = computed(() =>
  isLocked.value ? 'admin.staff.lockControl.unlock' : 'admin.staff.lockControl.lock',
);
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-wrap items-center gap-3">
      <button
        type="button"
        :class="BUTTON.secondary"
        :disabled="mutation.isPending.value"
        :aria-busy="mutation.isPending.value || undefined"
        @click="mutation.run(!isLocked)"
      >
        {{ $t(label) }}
      </button>
      <span class="text-sm text-muted">{{ $t('admin.staff.lockControl.hint') }}</span>
    </div>
    <AdminStatus
      v-if="mutation.failure.value"
      kind="refused"
      :text="failureTextOf(mutation.failure.value)"
    />
  </div>
</template>
