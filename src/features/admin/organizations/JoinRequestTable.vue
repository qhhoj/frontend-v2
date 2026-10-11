<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { NumberedPageMeta } from '@/api/client';
import { decideJoinRequest } from '@/api/organizations.api';
import type { JoinRequest, JoinRequestState } from '@/api/types/organizations';
import NumberedPager from '@/components/NumberedPager.vue';
import { formatNumericDateTime } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdminStatus from '../ui/AdminStatus.vue';
import AdminUserLabel from '../ui/AdminUserLabel.vue';
import { buttonClass } from '../ui/controls';
import { useAdminToast } from '../ui/feedback/use-admin-toast';
import AdminDataTable from '../ui/table/AdminDataTable.vue';
import { rangeOf } from '../ui/table/table-columns';
import type { AdminColumn } from '../ui/table/table-columns';
import { useBulkDecisions } from './join-request-bulk';
import {
  decisionFailureText,
  invalidateAfterDecision,
  isAlreadyDecided,
} from './join-request-decision';
import { useOrganizationWrite } from './organization-write';

type Decision = 'A' | 'R';

/**
 * Join requests of one organization or of every one (`withOrganization`): the name, the reason (wrapping) and the time stack
 * in one cell so the table fits a narrow column and the actions stay in view. Pending rows offer "Chấp nhận" and, in the ⋯ menu,
 * "Từ chối"; ticking rows swaps the toolbar for the bulk bar. A refusal shows on its row; a bulk run that partly fails says
 * so above the table. Every decision goes to the request's own organization.
 */
const props = defineProps<{
  rows: JoinRequest[];
  state: JoinRequestState;
  withOrganization: boolean;
  label: string;
  loading: boolean;
  error: unknown;
  meta?: NumberedPageMeta;
  pagerLabel: string;
  /** The query key of the pager (`requests` beside an organization's other panels). */
  pagerKey?: string;
  filtered?: boolean;
}>();
defineEmits<{ retry: []; 'clear-filters': [] }>();
defineSlots<{ toolbar?: () => unknown }>();
const queryClient = useQueryClient();
const locale = useLocaleStore();
const { t } = useI18n();
const toast = useAdminToast();
const bulk = useBulkDecisions(() => props.rows);
const failedId = ref<string | null>(null);

const decision = useOrganizationWrite<{ request: JoinRequest; next: Decision }, JoinRequest>({
  mutate: ({ request, next }) => decideJoinRequest(request.organizationSlug, request.id, next),
  onDone: (_result, { request, next }) => {
    toast.show({ text: t(`admin.organizations.queue.toast.${next}`, { name: request.username }) });
    return invalidateAfterDecision(queryClient, request.organizationSlug);
  },
});

async function decide(request: JoinRequest, next: Decision) {
  if (decision.isPending.value || bulk.isBusy.value) return;
  failedId.value = request.id;
  const done = await decision.run({ request, next });
  if (!done && isAlreadyDecided(decision.failure.value))
    await invalidateAfterDecision(queryClient, request.organizationSlug);
}

async function decideSelected(next: Decision) {
  await bulk.decide(next);
  const outcome = bulk.outcome.value;
  if (outcome && outcome.done > 0)
    toast.show({ text: t('admin.organizations.bulk.done', { count: outcome.done }) });
}

const columns = computed<AdminColumn[]>(() => [
  {
    key: 'user',
    label: t('admin.organizations.queue.columns.user'),
    priority: 'primary',
    cellClass: 'min-w-0 max-w-0 w-full',
  },
  ...(props.withOrganization
    ? [{ key: 'organization', label: t('admin.organizations.queue.columns.organization') }]
    : []),
  ...(props.state === 'P'
    ? []
    : [{ key: 'decided', label: t('admin.organizations.queue.columns.decided') }]),
]);
const range = computed(() => {
  const meta = props.meta;
  return meta && 'total' in meta
    ? rangeOf(meta.page, meta.pageSize, props.rows.length, meta.total)
    : null;
});
const timeOf = (value: string) => formatNumericDateTime(value, locale.locale);
function decidedText(request: JoinRequest): string {
  const decided = t(`admin.organizations.queue.decided.${request.state}`, {
    time: request.decidedAt ? timeOf(request.decidedAt) : '',
  });
  return request.decidedByUsername
    ? `${decided} · ${t('admin.organizations.queue.decidedBy', { name: request.decidedByUsername })}`
    : decided;
}
const bulkFailure = computed(() => {
  const outcome = bulk.outcome.value;
  if (!outcome || outcome.failed === 0) return '';
  return `${t('admin.organizations.bulk.failed', { count: outcome.failed })} ${decisionFailureText(outcome.firstFailure)}`;
});
</script>

<template>
  <div class="flex min-w-0 flex-col gap-3">
    <AdminStatus v-if="bulkFailure" kind="refused" :text="bulkFailure" />
    <AdminDataTable
      v-model:selected="bulk.ticked.value"
      :columns="columns"
      :rows="rows"
      :row-key="(request: JoinRequest) => request.id"
      :row-label="(request: JoinRequest) => request.username"
      :row-attrs="() => ({ 'data-testid': 'queue-row' })"
      :label="label"
      :selectable="state === 'P' && bulk.hasPending.value"
      :loading="loading"
      :error="error"
      :filtered="filtered"
      :empty-text="$t('admin.organizations.queue.empty')"
      :skeleton-rows="4"
      @retry="$emit('retry')"
      @clear-filters="$emit('clear-filters')"
    >
      <template v-if="$slots.toolbar" #toolbar><slot name="toolbar" /></template>
      <template #bulk>
        <button
          type="button"
          :class="buttonClass('secondary', 'sm')"
          :aria-disabled="bulk.isBusy.value || undefined"
          @click="!bulk.isBusy.value && decideSelected('R')"
        >
          {{ $t('admin.organizations.bulk.reject') }}
        </button>
        <button
          type="button"
          :class="buttonClass('primary', 'sm')"
          :aria-disabled="bulk.isBusy.value || undefined"
          :aria-busy="bulk.isBusy.value || undefined"
          @click="!bulk.isBusy.value && decideSelected('A')"
        >
          {{ $t('admin.organizations.bulk.accept') }}
        </button>
      </template>
      <template #cell-user="{ row }">
        <div class="flex min-w-0 flex-col items-start gap-1 py-2">
          <AdminUserLabel :username="row.username" />
          <p class="m-0 text-sm break-words whitespace-pre-line">{{ row.reason }}</p>
          <time :datetime="row.createdAt" class="font-mono text-xs text-muted tabular-nums">{{
            timeOf(row.createdAt)
          }}</time>
          <AdminStatus
            v-if="failedId === row.id && decision.failure.value"
            kind="refused"
            :text="decisionFailureText(decision.failure.value)"
          />
        </div>
      </template>
      <template #cell-organization="{ row }">
        <RouterLink
          data-testid="queue-org"
          :to="{ name: 'admin-organizations', query: { org: row.organizationSlug } }"
          class="font-mono text-accent-text hover:underline"
          >{{ row.organizationSlug }}</RouterLink
        >
      </template>
      <template #cell-decided="{ row }">
        <span class="text-sm text-muted">{{ decidedText(row) }}</span>
      </template>
      <template v-if="state === 'P'" #actions="{ row }">
        <button
          type="button"
          :class="buttonClass('primary', 'sm')"
          :aria-disabled="decision.isPending.value || undefined"
          @click="decide(row, 'A')"
        >
          {{ $t('admin.organizations.queue.accept') }}
        </button>
        <button
          type="button"
          :class="buttonClass('secondary', 'sm')"
          :aria-disabled="decision.isPending.value || undefined"
          @click="decide(row, 'R')"
        >
          {{ $t('admin.organizations.queue.reject') }}
        </button>
      </template>
      <template v-if="meta" #footer>
        <span v-if="range" class="font-mono tabular-nums">{{
          $t('admin.table.range', range)
        }}</span>
        <NumberedPager
          class="ml-auto"
          compact
          :meta="meta"
          :label="pagerLabel"
          :query-key="pagerKey"
        />
      </template>
    </AdminDataTable>
  </div>
</template>
