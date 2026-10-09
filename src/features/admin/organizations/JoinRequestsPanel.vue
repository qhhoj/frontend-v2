<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { useRoute } from 'vue-router';
import EmptyState from '@/components/EmptyState.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import { decideJoinRequest } from '@/api/organizations.api';
import type { JoinRequest, JoinRequestState } from '@/api/types/organizations';
import { useJoinRequestsQuery } from '@/features/organizations/organizations.queries';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import { formatDateTime } from '@/lib/format';
import { pageFromQuery } from '@/lib/paging';
import { useLocaleStore } from '@/stores/locale.store';
import AdminStatus from '../ui/AdminStatus.vue';
import AdminUserLabel from '../ui/AdminUserLabel.vue';
import { ADMIN_BUTTON_CLASS, ADMIN_PRIMARY_CLASS } from '../ui/classes';
import { shortId } from '../ui/short-id';
import { ADMIN_BIT_KINDS } from '../shell/admin-bit';
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

async function decide(request: JoinRequest, next: 'A' | 'R') {
  if (decision.isPending.value) return;
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
        <span class="text-sm text-muted">{{
          $t('admin.organizations.requests.pendingCount', { count: pendingTotal })
        }}</span>
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
          :class="ADMIN_BUTTON_CLASS"
          :aria-pressed="state === tab.state"
          @click="state = tab.state"
        >
          {{ $t(tab.labelKey) }}
        </button>
      </div>
      <ul v-if="rows.length > 0" class="flex flex-col divide-y divide-line">
        <li v-for="row in rows" :key="row.id" class="flex flex-col gap-2 py-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <AdminUserLabel :username="row.username" />
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
            {{ $t('admin.organizations.requests.decidedBy', { id: shortId(row.decidedBy) }) }}
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
