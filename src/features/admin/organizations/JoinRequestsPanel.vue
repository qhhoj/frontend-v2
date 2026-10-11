<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import EmptyState from '@/components/EmptyState.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import { decideJoinRequest } from '@/api/organizations.api';
import type { JoinRequest, JoinRequestState } from '@/api/types/organizations';
import {
  useJoinRequestsQuery,
  useOrganizationQuery,
} from '@/features/organizations/organizations.queries';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import { formatDateTime } from '@/lib/format';
import { pageFromQuery } from '@/lib/paging';
import { useLocaleStore } from '@/stores/locale.store';
import AdminStatus from '../ui/AdminStatus.vue';
import AdminUserLabel from '../ui/AdminUserLabel.vue';
import { ADMIN_BUTTON_CLASS, ADMIN_PRIMARY_CLASS, ADMIN_TOGGLE_CLASS } from '../ui/classes';
import { shortId } from '../ui/short-id';
import { ADMIN_BIT_KINDS } from '../shell/admin-bit';
import BulkDecisionBar from './BulkDecisionBar.vue';
import { useBulkDecisions } from './join-request-bulk';
import {
  decisionFailureText,
  invalidateAfterDecision,
  isAlreadyDecided,
} from './join-request-decision';
import { useOrganizationWrite } from './organization-write';

const STATE_TABS: { state: JoinRequestState; labelKey: string }[] = [
  { state: 'P', labelKey: 'admin.organizations.requests.pending' },
  { state: 'A', labelKey: 'admin.organizations.requests.accepted' },
  { state: 'R', labelKey: 'admin.organizations.requests.refused' },
];
const props = defineProps<{ slug: string }>();
const route = useRoute();
const queryClient = useQueryClient();
const locale = useLocaleStore();
const { t } = useI18n();
const state = ref<JoinRequestState>('P');
const page = computed(() => pageFromQuery(route.query.requests));
const requests = useJoinRequestsQuery(() => props.slug, state, page, true);
const pendingCount = useJoinRequestsQuery(() => props.slug, 'P', 1, true);
const failedRequestId = ref<string | null>(null);

const decision = useOrganizationWrite<{ request: JoinRequest; next: 'A' | 'R' }, JoinRequest>({
  mutate: ({ request, next }) => decideJoinRequest(props.slug, request.id, next),
  onDone: () => invalidateAfterDecision(queryClient, props.slug),
});

const rows = computed(() => requests.data.value?.items ?? []);
const pendingTotal = computed(() => pendingCount.data.value?.meta.total ?? 0);
const bulk = useBulkDecisions(() => rows.value);
const detail = useOrganizationQuery(() => props.slug);
/** Members against seats: how many approvals still fit before `organization_full`. */
const seatsText = computed(() => {
  const organization = detail.data.value;
  if (!organization) return '';
  return organization.slots === null
    ? t('admin.organizations.requests.seatsOpen', { members: organization.memberCount })
    : t('admin.organizations.requests.seats', {
        members: organization.memberCount,
        slots: organization.slots,
        left: Math.max(0, organization.slots - organization.memberCount),
      });
});
const deciderOf = (request: JoinRequest) =>
  request.decidedByUsername ?? (request.decidedBy ? shortId(request.decidedBy) : '');

async function decide(request: JoinRequest, next: 'A' | 'R') {
  if (decision.isPending.value || bulk.isBusy.value) return;
  failedRequestId.value = request.id;
  const done = await decision.run({ request, next });
  if (!done && isAlreadyDecided(decision.failure.value))
    await invalidateAfterDecision(queryClient, props.slug);
}
</script>

<template>
  <section data-testid="join-requests">
    <SettingsCard
      :title="$t('admin.organizations.requests.title')"
      :lead="$t('admin.organizations.requests.note')"
    >
      <template #header-end>
        <span class="flex flex-col items-end text-sm text-muted">
          <span>{{
            $t('admin.organizations.requests.pendingCount', { count: pendingTotal })
          }}</span>
          <span data-testid="seats-line">{{ seatsText }}</span>
        </span>
      </template>
      <div
        class="flex flex-wrap gap-2"
        role="group"
        :aria-label="$t('admin.organizations.requests.title')"
      >
        <button
          v-for="tab in STATE_TABS"
          :key="tab.state"
          type="button"
          :class="ADMIN_TOGGLE_CLASS"
          :aria-pressed="state === tab.state"
          @click="state = tab.state"
        >
          {{ $t(tab.labelKey) }}
        </button>
      </div>
      <BulkDecisionBar
        v-if="state === 'P' && bulk.hasPending.value"
        :selected-count="bulk.selected.value.length"
        :is-all-ticked="bulk.isAllTicked.value"
        :busy="bulk.isBusy.value"
        :outcome="bulk.outcome.value"
        @toggle-all="bulk.toggleAll()"
        @decide="bulk.decide"
      />
      <ul v-if="rows.length > 0" class="flex flex-col divide-y divide-line">
        <li v-for="row in rows" :key="row.id" class="flex flex-col gap-2 py-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <label v-if="row.state === 'P'" class="flex min-h-11 items-center gap-2">
              <input
                type="checkbox"
                class="size-4 accent-accent"
                :checked="bulk.ticked.value.has(row.id)"
                :aria-label="$t('admin.organizations.bulk.selectNamed', { username: row.username })"
                @change="bulk.toggle(row.id)"
              />
              <AdminUserLabel :username="row.username" />
            </label>
            <AdminUserLabel v-else :username="row.username" />
            <time :datetime="row.createdAt" class="text-sm text-muted">{{
              formatDateTime(row.createdAt, locale.locale)
            }}</time>
          </div>
          <p class="whitespace-pre-line text-sm">{{ row.reason }}</p>
          <div v-if="row.state === 'P'" class="flex flex-wrap gap-2">
            <button type="button" :class="ADMIN_BUTTON_CLASS" @click="decide(row, 'R')">
              {{ $t('admin.organizations.requests.refuse') }}
            </button>
            <button type="button" :class="ADMIN_PRIMARY_CLASS" @click="decide(row, 'A')">
              {{ $t('admin.organizations.requests.accept') }}
            </button>
          </div>
          <p v-else-if="row.decidedBy" class="text-sm text-muted">
            {{ $t('admin.organizations.requests.decidedBy', { name: deciderOf(row) }) }}
          </p>
          <AdminStatus
            v-if="failedRequestId === row.id && decision.failure.value"
            kind="refused"
            :text="decisionFailureText(decision.failure.value)"
          />
        </li>
      </ul>
      <EmptyState v-else compact :kind="ADMIN_BIT_KINDS.empty">
        {{ $t('admin.organizations.requests.empty') }}
      </EmptyState>
      <NumberedPager
        v-if="requests.data.value"
        :meta="requests.data.value.meta"
        :label="$t('admin.organizations.requests.pager')"
        query-key="requests"
      />
    </SettingsCard>
  </section>
</template>
