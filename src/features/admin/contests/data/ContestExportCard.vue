<script setup lang="ts">
import { computed } from 'vue';
import type { ApiError } from '@/api/client';
import { contestExportDownloadUrl, prepareContestExport } from '@/api/contest-ops.api';
import type { EditableContest } from '@/api/types/contest-editing';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { translate } from '@/i18n';
import { formatFileSize } from '@/lib/format';
import { formatDate } from '@/lib/format-date';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import { useViewerId } from '@/stores/use-viewer-id';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf, hasIssueCode } from '../../ui/admin-errors';
import { CARD, buttonClass } from '../../ui/controls';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { canPrepareAgain } from '../actions/contest-actions';
import { contestActionsKey, contestExportKey, useContestExportQuery } from '../contest-ops.queries';

const props = defineProps<{ contest: EditableContest }>();
const viewer = useViewerId();
const locale = useLocaleStore();
const now = useNow();
const isEnded = computed(() => props.contest.phase === 'ended');
const {
  data: status,
  error,
  isPending,
  refetch,
} = useContestExportQuery(() => props.contest.key, isEnded);
const prepare = useAdminMutation({
  mutate: () => prepareContestExport(props.contest.key),
  invalidates: () => [
    contestExportKey(props.contest.key, viewer.value),
    contestActionsKey(props.contest.key, viewer.value),
  ],
});
const mayPrepare = computed(() =>
  status.value ? canPrepareAgain(status.value, now.value) : false,
);
/** The issue code `export_not_configured` means this install has no export root (same as the contest data download). */
const isNotConfigured = computed(() => hasIssueCode(error.value, 'export_not_configured'));
const EXPORT_REFUSALS = ['export_in_progress', 'export_rate_limited', 'export_not_prepared'];
/** The refusal's own text by issue code, else the generic text of its status. */
function prepareFailureText(failure: ApiError): string {
  const refusal = failure.issues.find((issue) => EXPORT_REFUSALS.includes(issue.code));
  return refusal
    ? translate(`admin.contestData.export.errors.${refusal.code}`)
    : failureTextOf(failure);
}
const isReady = computed(() => status.value?.state === 'ready');
</script>

<template>
  <section data-testid="export-card" :class="[CARD, 'flex flex-col gap-4 p-5']">
    <header class="flex flex-col gap-1">
      <h3 class="m-0 text-base font-semibold">{{ $t('admin.contestData.export.title') }}</h3>
      <p class="text-sm text-muted">{{ $t('admin.contestData.export.description') }}</p>
    </header>
    <p v-if="!isEnded" class="text-sm text-muted">{{ $t('admin.contestData.export.notEnded') }}</p>
    <p v-else-if="isNotConfigured" class="text-sm text-muted">
      {{ $t('admin.contestData.export.notConfigured') }}
    </p>
    <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <SkeletonBlock data-skeleton-region="export-status" class="h-24 w-full" />
      </template>
      <div v-if="status" class="flex flex-col gap-3">
        <AdminStatus
          v-if="status.state === 'preparing'"
          kind="queued"
          :text="$t('admin.contestData.export.preparing')"
        />
        <p v-else-if="isReady && status.size !== null" class="text-sm font-semibold">
          {{
            $t('admin.contestData.export.ready', {
              size: formatFileSize(status.size),
              readyAt: status.readyAt ? formatDate(status.readyAt, 'datetime', locale.locale) : '',
            })
          }}
        </p>
        <p v-else class="text-sm text-muted">{{ $t('admin.contestData.export.none') }}</p>
        <div class="flex flex-wrap items-center gap-3">
          <button
            type="button"
            :class="buttonClass('primary')"
            :aria-disabled="!mayPrepare || prepare.isPending.value || undefined"
            @click="mayPrepare && prepare.run(undefined)"
          >
            {{ $t('admin.contestData.export.prepare') }}
          </button>
          <a
            v-if="isReady"
            :href="contestExportDownloadUrl(contest.key)"
            download
            :class="buttonClass('secondary')"
            >{{ $t('admin.contestData.export.download') }}</a
          >
        </div>
        <p
          v-if="!mayPrepare && status.state !== 'preparing' && status.nextPrepareAt"
          class="text-sm text-muted"
        >
          {{
            $t('admin.contestData.export.waitUntil', {
              time: formatDate(status.nextPrepareAt, 'datetime', locale.locale),
            })
          }}
        </p>
        <AdminStatus
          v-if="prepare.failure.value"
          kind="refused"
          :text="prepareFailureText(prepare.failure.value)"
        />
      </div>
    </QueryState>
  </section>
</template>
