<script setup lang="ts">
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { decideJoinRequest } from '@/api/organizations.api';
import type { JoinRequestState } from '@/api/types/organizations';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import StatePanel from '@/components/StatePanel.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { formatNumber } from '@/lib/format';
import { pageFromQuery } from '@/lib/paging';
import { useLocaleStore } from '@/stores/locale.store';
import JoinRequestRow from './JoinRequestRow.vue';
import { membershipErrorCopy } from './membership-errors';
import { useJoinRequestsQuery } from './organizations.queries';
import { useOrganization } from './use-organization';

/** The administrators' queue of join requests, one state per tab. Everyone else sees the forbidden state. */
const STATES: JoinRequestState[] = ['P', 'A', 'R'];
const route = useRoute();
const client = useQueryClient();
const { slug, query: organizationQuery } = useOrganization();
const organization = computed(() => organizationQuery.data.value);
const isAdministrator = computed(() => organization.value?.viewer?.canAdminister === true);
const state = computed<JoinRequestState>(() => {
  const value = String(route.query.state ?? 'P');
  return STATES.find((option) => option === value) ?? 'P';
});
const page = computed(() => pageFromQuery(route.query.page));
const requests = useJoinRequestsQuery(slug, state, page, isAdministrator);
const { t } = useI18n();
/** The deciding admin's name, or "an administrator" when the admin list no longer has them. */
const deciderName = (id: string | null) =>
  organization.value?.admins.find((admin) => admin.id === id)?.username ??
  t('orgMembership.anAdmin');
const decision = useMutation({
  mutationFn: (command: { id: string; state: 'A' | 'R' }) =>
    decideJoinRequest(slug.value, command.id, command.state),
  // A refused decision (409) means the queue changed under us: reload it so the row shows its real state.
  onSettled: () => client.invalidateQueries({ queryKey: ['organizations'] }),
});
const errorCopy = computed(() =>
  decision.error.value
    ? membershipErrorCopy(
        decision.variables.value?.state === 'A' ? 'approve' : 'reject',
        decision.error.value,
      )
    : null,
);
const decidingId = computed(() => (decision.isPending.value ? decision.variables.value?.id : null));
const locale = useLocaleStore();
const total = computed(() => requests.data.value?.meta.total ?? 0);
const isEmpty = computed(() => (requests.data.value?.items.length ?? 0) === 0);
</script>

<template>
  <StatePanel
    v-if="organization && !isAdministrator"
    kind="forbidden"
    :title="$t('orgMembership.forbiddenTitle')"
  />
  <div v-else-if="organization" class="flex flex-col gap-4">
    <h2 class="font-display text-xl font-semibold">
      {{ $t('orgMembership.requests') }} · {{ formatNumber(total, locale.locale) }}
    </h2>
    <nav :aria-label="$t('orgMembership.statesLabel')" class="flex gap-1 overflow-x-auto">
      <RouterLink
        v-for="option in STATES"
        :key="option"
        :to="{ name: 'organization-requests', params: { slug }, query: { state: option } }"
        class="inline-flex min-h-11 items-center whitespace-nowrap rounded-pill px-4 font-semibold text-muted hover:text-content"
        exact-active-class="bg-accent-soft text-accent-soft-text"
      >
        {{ $t(`orgMembership.states.${option}`) }}
      </RouterLink>
    </nav>
    <StatePanel
      v-if="errorCopy"
      kind="error"
      :title="$t(errorCopy.title)"
      :body="$t(errorCopy.body)"
    />
    <QueryState
      :loading="requests.isPending.value"
      :error="requests.error.value"
      @retry="requests.refetch()"
    >
      <template #skeleton><SkeletonBlock class="h-40 w-full" /></template>
      <StatePanel
        v-if="isEmpty && state === 'P'"
        kind="communityEmpty"
        :title="$t('orgMembership.emptyTitle')"
        :body="$t('orgMembership.emptyBody')"
      />
      <StatePanel v-else-if="isEmpty" kind="empty" :title="$t('orgMembership.emptyDecided')" />
      <ul v-else class="divide-y divide-line rounded-card border border-line">
        <li v-for="request in requests.data.value?.items" :key="request.id">
          <JoinRequestRow
            :request="request"
            :decider-name="deciderName(request.decidedBy)"
            :busy="decidingId === request.id"
            @decide="(decided) => decision.mutate({ id: request.id, state: decided })"
          />
        </li>
      </ul>
      <NumberedPager
        v-if="requests.data.value"
        :meta="requests.data.value.meta"
        :label="$t('orgMembership.requestsPager')"
        class="mt-4"
      />
    </QueryState>
  </div>
</template>
