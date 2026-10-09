<script setup lang="ts">
import CopyButton from '@/components/CopyButton.vue';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureReasonOf } from '../failure-reason';
import UploadButton from '../../ui/UploadButton.vue';
import { useProblemUpload } from './use-problem-upload';
import type { ProblemUploadKind } from './use-problem-upload';

const props = defineProps<{
  kind: ProblemUploadKind;
  code: string;
  testId: string;
  title: string;
  lead: string;
  buttonLabel: string;
  accept: string;
  endpoint: string;
  maxBytes?: number;
  /** The permission a locked card names instead of the button. */
  lockedBy?: string;
  /** The address the problem stores now; omitted when the card shows no current file. */
  currentUrl?: string | null;
  headingLevel?: 2 | 3;
}>();
const upload = useProblemUpload(props.kind, () => props.code);
</script>

<template>
  <SettingsCard
    :data-testid="testId"
    :title="title"
    :lead="lead"
    :heading-level="headingLevel ?? 2"
  >
    <p class="font-mono text-xs text-muted">{{ endpoint }}</p>
    <p v-if="currentUrl !== undefined" class="text-sm">
      <template v-if="currentUrl">
        {{ $t('admin.problems.files.current') }}
        <a :href="currentUrl" class="font-semibold text-accent-text underline">{{
          $t('admin.problems.files.open')
        }}</a>
      </template>
      <span v-else class="text-muted">{{ $t('admin.problems.files.none') }}</span>
    </p>
    <p v-if="lockedBy" class="text-sm text-muted">
      {{ $t('admin.ui.needsPermission', { permission: lockedBy }) }}
    </p>
    <UploadButton
      v-else
      :label="buttonLabel"
      :accept="accept"
      :max-bytes="maxBytes"
      :is-pending="upload.mutation.isPending.value"
      @picked="upload.mutation.run"
    />
    <AdminStatus
      v-if="upload.mutation.failure.value"
      kind="refused"
      :text="failureReasonOf(upload.mutation.failure.value)"
    />
    <AdminStatus
      v-else-if="upload.url.value"
      kind="done"
      :text="$t('admin.problems.files.uploaded', { url: upload.url.value })"
    >
      <CopyButton :text="upload.url.value" :label="$t('admin.problems.files.copy')" />
    </AdminStatus>
  </SettingsCard>
</template>
