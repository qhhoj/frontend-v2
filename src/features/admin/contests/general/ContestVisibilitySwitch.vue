<script setup lang="ts">
import { computed } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { updateContest } from '@/api/contest-editing.api';
import type { EditableContest } from '@/api/types/contest-editing';
import { translate } from '@/i18n';
import { usePermissions } from '@/stores/use-permissions';
import { useViewerId } from '@/stores/use-viewer-id';
import AdminSwitch from '../../ui/AdminSwitch.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import {
  CONTEST_INDEX_KEY,
  PUBLIC_CONTESTS_KEY,
  editableContestKey,
} from '../contest-editing.queries';
import { canSetVisible } from '../contest-form';

/**
 * "Hiển thị": shows or hides the contest at once, outside the tab's form. The state reads in words beside the switch, and
 * a refusal sits under it. Locked like the form field: change_contest_visibility, or create_private_contest on a private contest.
 */
const props = defineProps<{ contest: EditableContest }>();
const { can } = usePermissions();
const queryClient = useQueryClient();
const viewer = useViewerId();
const KEY = 'admin.contests.general.rail.visibility';

const settings = computed(() => props.contest.settings);
const lockedBy = computed(() => {
  const privacy = {
    isPrivate: settings.value?.isPrivate ?? false,
    isOrganizationPrivate: settings.value?.isOrganizationPrivate ?? false,
  };
  return canSetVisible(privacy, can) ? undefined : 'judge.change_contest_visibility';
});
const mutation = useAdminMutation({
  mutate: (isVisible: boolean) => updateContest(props.contest.key, { isVisible }),
  invalidates: () => [PUBLIC_CONTESTS_KEY, CONTEST_INDEX_KEY],
  successText: (saved: EditableContest) =>
    translate(saved.settings?.isVisible ? `${KEY}.shown` : `${KEY}.hidden`, { key: saved.key }),
  onDone: (saved: EditableContest) =>
    queryClient.setQueryData(editableContestKey(saved.key, viewer.value), saved),
});
const isVisible = computed({
  get: () => settings.value?.isVisible ?? false,
  set: (next: boolean) => void mutation.run(next),
});
const stateText = computed(() => translate(isVisible.value ? `${KEY}.onState` : `${KEY}.offState`));
</script>

<template>
  <div class="flex flex-col gap-1" data-testid="contest-visibility">
    <AdminSwitch
      v-model="isVisible"
      :label="$t(`${KEY}.label`)"
      :description="stateText"
      :locked-by="lockedBy"
      :aria-busy="mutation.isPending.value || undefined"
    />
    <p v-if="mutation.failure.value" role="alert" class="m-0 text-xs text-negative">
      {{ failureTextOf(mutation.failure.value) }}
    </p>
  </div>
</template>
