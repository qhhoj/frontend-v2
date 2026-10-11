<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import type { JoinRequestState } from '@/api/types/organizations';
import {
  useJoinRequestsQuery,
  useOrganizationQuery,
} from '@/features/organizations/organizations.queries';
import { pageFromQuery } from '@/lib/paging';
import AdminFilterTabs from '../ui/AdminFilterTabs.vue';
import type { AdminFilterTab } from '../ui/AdminFilterTabs.vue';
import JoinRequestTable from './JoinRequestTable.vue';

/** One organization's join requests (the admin page's Yêu cầu tab and the organization's own Quản lý tab). */
const STATES: JoinRequestState[] = ['P', 'A', 'R'];
const props = defineProps<{ slug: string }>();
const route = useRoute();
const { t } = useI18n();
const state = ref<JoinRequestState>('P');
const page = computed(() => pageFromQuery(route.query.requests));
const requests = useJoinRequestsQuery(() => props.slug, state, page, true);
const pendingCount = useJoinRequestsQuery(() => props.slug, 'P', 1, true);
const pendingTotal = computed(() => pendingCount.data.value?.meta.total ?? 0);
const detail = useOrganizationQuery(() => props.slug);
const stateTabs = computed<AdminFilterTab[]>(() =>
  STATES.map((key) => ({
    key,
    label: t(`admin.organizations.queue.states.${key}`),
    ...(key === 'P' ? { count: pendingTotal.value } : {}),
  })),
);
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
</script>

<template>
  <section
    data-testid="join-requests"
    :aria-labelledby="`join-requests-${slug}`"
    class="flex min-w-0 flex-col gap-3"
  >
    <header class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <h3 :id="`join-requests-${slug}`" class="font-display text-base font-semibold">
        {{ $t('admin.organizations.requests.title') }}
      </h3>
      <span data-testid="seats-line" class="text-sm text-muted tabular-nums">{{ seatsText }}</span>
    </header>
    <JoinRequestTable
      :rows="requests.data.value?.items ?? []"
      :state="state"
      :with-organization="false"
      :label="$t('admin.organizations.requests.title')"
      :loading="requests.isPending.value"
      :error="requests.error.value"
      :meta="requests.data.value?.meta"
      :pager-label="$t('admin.organizations.requests.pager')"
      pager-key="requests"
      @retry="requests.refetch()"
    >
      <template #toolbar>
        <AdminFilterTabs
          :tabs="stateTabs"
          :current="state"
          :label="$t('admin.organizations.queue.states.label')"
          @update:current="state = $event as JoinRequestState"
        />
      </template>
    </JoinRequestTable>
  </section>
</template>
