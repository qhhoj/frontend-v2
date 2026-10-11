<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import EmptyState from '@/components/EmptyState.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { decideJoinRequest } from '@/api/organizations.api';
import type { JoinRequest, JoinRequestState } from '@/api/types/organizations';
import { formatNumericDateTime } from '@/lib/format';
import { pageFromQuery } from '@/lib/paging';
import { useLocaleStore } from '@/stores/locale.store';
import { ADMIN_BIT_KINDS } from '../shell/admin-bit';
import { searchQueryOf } from '../search/index-search';
import IndexSearchBox from '../search/IndexSearchBox.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import AdminUserLabel from '../ui/AdminUserLabel.vue';
import AdminFilterTabs from '../ui/AdminFilterTabs.vue';
import type { AdminFilterTab } from '../ui/AdminFilterTabs.vue';
import { ADMIN_BUTTON_CLASS, ADMIN_PRIMARY_CLASS } from '../ui/classes';
import {
  decisionFailureText,
  invalidateAfterDecision,
  isAlreadyDecided,
} from './join-request-decision';
import BulkDecisionBar from './BulkDecisionBar.vue';
import { useBulkDecisions } from './join-request-bulk';
import { useAllJoinRequestsQuery } from './join-requests.queries';
import { requestSearchOf, requestStateOf } from './organization-search';
import { useOrganizationWrite } from './organization-write';

const STATE_TABS: JoinRequestState[] = ['P', 'A', 'R'];
const route = useRoute();
const router = useRouter();
const queryClient = useQueryClient();
const locale = useLocaleStore();
const { t } = useI18n();
const state = computed(() => requestStateOf(route.query));
const page = computed(() => pageFromQuery(route.query.page));
const search = computed(() => requestSearchOf(route.query));
const list = useAllJoinRequestsQuery(state, page, search);
const rows = computed(() => list.data.value?.items ?? []);
const bulk = useBulkDecisions(() => rows.value);

function searchFor(text: string) {
  void router.replace({ query: searchQueryOf(route.query, { q: text }) });
}
const decidingId = ref<string | null>(null);

const decision = useOrganizationWrite<{ request: JoinRequest; next: 'A' | 'R' }, JoinRequest>({
  mutate: ({ request, next }) => decideJoinRequest(request.organizationSlug, request.id, next),
  onDone: (_result, { request }) => invalidateAfterDecision(queryClient, request.organizationSlug),
});

async function decide(request: JoinRequest, next: 'A' | 'R') {
  if (decision.isPending.value || bulk.isBusy.value) return;
  decidingId.value = request.id;
  const done = await decision.run({ request, next });
  if (!done && isAlreadyDecided(decision.failure.value))
    await invalidateAfterDecision(queryClient, request.organizationSlug);
}

function decidedText(request: JoinRequest): string {
  const time = request.decidedAt ? formatNumericDateTime(request.decidedAt, locale.locale) : '';
  const decided = t(`admin.organizations.queue.decided.${request.state}`, { time });
  return request.decidedByUsername
    ? `${decided} · ${t('admin.organizations.queue.decidedBy', { name: request.decidedByUsername })}`
    : decided;
}

/** A state tab keeps the search and returns to page 1. */
const stateLink = (next: JoinRequestState) => ({
  query: {
    view: 'requests',
    ...(next === 'P' ? {} : { state: next }),
    ...(search.value ? { q: search.value } : {}),
  },
});
const stateTabs = computed<AdminFilterTab[]>(() =>
  STATE_TABS.map((tab) => ({
    key: tab,
    label: t(`admin.organizations.queue.states.${tab}`),
    to: stateLink(tab),
  })),
);
</script>

<template>
  <section data-testid="queue" class="flex min-w-0 flex-col gap-4">
    <header class="flex flex-col gap-2">
      <h2 class="font-display text-xl font-semibold">
        {{ $t('admin.organizations.queue.title') }}
      </h2>
      <span class="w-fit rounded-pill border border-line px-2 py-0.5 font-mono text-xs text-muted">
        judge.edit_all_organization
      </span>
    </header>
    <AdminFilterTabs
      :tabs="stateTabs"
      :current="state"
      :label="$t('admin.organizations.queue.states.label')"
    />
    <IndexSearchBox
      :value="search"
      :label="$t('admin.organizations.queue.search.label')"
      :placeholder="$t('admin.organizations.queue.search.placeholder')"
      :clear-label="$t('admin.search.clear')"
      :hint="$t('admin.organizations.queue.search.hint')"
      @commit="searchFor"
    />
    <BulkDecisionBar
      v-if="state === 'P' && bulk.hasPending.value"
      :selected-count="bulk.selected.value.length"
      :is-all-ticked="bulk.isAllTicked.value"
      :busy="bulk.isBusy.value"
      :outcome="bulk.outcome.value"
      @toggle-all="bulk.toggleAll()"
      @decide="bulk.decide"
    />
    <QueryState :loading="list.isPending.value" :error="list.error.value" @retry="list.refetch()">
      <template #skeleton>
        <SkeletonBlock class="h-56 w-full rounded-row" />
      </template>
      <div
        v-if="rows.length > 0"
        role="region"
        tabindex="0"
        :aria-label="$t('admin.organizations.queue.region')"
        class="overflow-x-auto rounded-card border border-line"
      >
        <table class="w-full text-left text-sm">
          <thead class="text-muted">
            <tr>
              <th v-if="state === 'P'" scope="col" class="w-10 px-3 py-2">
                <span class="sr-only">{{ $t('admin.organizations.bulk.selectColumn') }}</span>
              </th>
              <th scope="col" class="px-3 py-2 font-semibold">
                {{ $t('admin.organizations.queue.columns.organization') }}
              </th>
              <th scope="col" class="px-3 py-2 font-semibold">
                {{ $t('admin.organizations.queue.columns.user') }}
              </th>
              <th scope="col" class="px-3 py-2 font-semibold">
                {{ $t('admin.organizations.queue.columns.reason') }}
              </th>
              <th scope="col" class="px-3 py-2 font-semibold">
                {{ $t('admin.organizations.queue.columns.sentAt') }}
              </th>
              <th scope="col" class="px-3 py-2">
                <span class="sr-only">{{ $t('admin.organizations.queue.columns.actions') }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="request in rows"
              :key="request.id"
              data-testid="queue-row"
              class="border-t border-line align-top"
            >
              <td v-if="state === 'P'" class="px-3 py-3">
                <input
                  type="checkbox"
                  class="size-4 accent-accent"
                  :checked="bulk.ticked.value.has(request.id)"
                  :aria-label="
                    $t('admin.organizations.bulk.selectNamed', { username: request.username })
                  "
                  @change="bulk.toggle(request.id)"
                />
              </td>
              <td class="px-3 py-3">
                <RouterLink
                  data-testid="queue-org"
                  :to="{ name: 'admin-organizations', query: { org: request.organizationSlug } }"
                  class="font-mono text-accent hover:underline"
                >
                  {{ request.organizationSlug }}
                </RouterLink>
              </td>
              <td class="px-3 py-3"><AdminUserLabel :username="request.username" /></td>
              <td class="max-w-xs px-3 py-3 whitespace-pre-line">{{ request.reason }}</td>
              <td class="px-3 py-3">
                <time :datetime="request.createdAt" class="font-mono text-xs text-muted">{{
                  formatNumericDateTime(request.createdAt, locale.locale)
                }}</time>
              </td>
              <td class="px-3 py-3">
                <div v-if="request.state === 'P'" class="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    :class="[ADMIN_BUTTON_CLASS, 'min-h-11']"
                    :aria-disabled="decision.isPending.value"
                    @click="decide(request, 'R')"
                  >
                    {{ $t('admin.organizations.queue.reject') }}
                  </button>
                  <button
                    type="button"
                    :class="[ADMIN_PRIMARY_CLASS, 'min-h-11']"
                    :aria-disabled="decision.isPending.value"
                    @click="decide(request, 'A')"
                  >
                    {{ $t('admin.organizations.queue.accept') }}
                  </button>
                </div>
                <p v-else class="text-sm text-muted">{{ decidedText(request) }}</p>
                <AdminStatus
                  v-if="decidingId === request.id && decision.failure.value"
                  kind="refused"
                  :text="decisionFailureText(decision.failure.value)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <EmptyState v-else compact :kind="ADMIN_BIT_KINDS.empty">
        {{ $t('admin.organizations.queue.empty') }}
      </EmptyState>
      <p class="text-sm text-muted">
        {{
          $t(`admin.organizations.queue.count.${state}`, {
            total: list.data.value?.meta.total ?? 0,
          })
        }}
      </p>
      <NumberedPager
        v-if="list.data.value"
        :meta="list.data.value.meta"
        :label="$t('admin.organizations.queue.pager')"
      />
    </QueryState>
  </section>
</template>
