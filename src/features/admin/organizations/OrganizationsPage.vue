<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { useOrganizationsQuery } from '@/features/organizations/organizations.queries';
import { pageFromQuery } from '@/lib/paging';
import { usePermissions } from '@/stores/use-permissions';
import AdminBit from '../shell/AdminBit.vue';
import { searchQueryOf } from '../search/index-search';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import { ADMIN_BUTTON_CLASS, ADMIN_PRIMARY_CLASS } from '../ui/classes';
import AllRequestsPanel from './AllRequestsPanel.vue';
import OrganizationAdminPanels from './OrganizationAdminPanels.vue';
import OrganizationEditor from './OrganizationEditor.vue';
import OrganizationList from './OrganizationList.vue';
import { organizationSearchOf, organizationsViewOf } from './organization-search';
import { ORGANIZATION_QUEUE_PERMISSION, useAllJoinRequestsQuery } from './join-requests.queries';

/** `?org=<slug>` edits an organization, `?org=new` creates one; neither names one. */
const NEW_ORGANIZATION = 'new';
const route = useRoute();
const router = useRouter();
const { can } = usePermissions();
const canSeeQueue = computed(() => can(ORGANIZATION_QUEUE_PERMISSION));
const view = computed(() => organizationsViewOf(route.query, canSeeQueue.value));
const orgParam = computed(() => (typeof route.query.org === 'string' ? route.query.org : null));
const isCreating = computed(() => orgParam.value === NEW_ORGANIZATION);
const editedSlug = computed(() =>
  orgParam.value === null || isCreating.value ? null : orgParam.value,
);
const page = computed(() => pageFromQuery(route.query.page));
const search = computed(() => organizationSearchOf(route.query));
const organizations = useOrganizationsQuery(page, search);
const pending = useAllJoinRequestsQuery('P', 1);
const pendingTotal = computed(() => pending.data.value?.meta.total ?? 0);
const canAdd = computed(() => can('judge.add_organization'));

function startCreate() {
  void router.push({ query: { ...route.query, org: NEW_ORGANIZATION } });
}

function searchFor(text: string) {
  void router.replace({ query: searchQueryOf(route.query, { q: text }) });
}

const tabClass = (selected: boolean) => [
  ADMIN_BUTTON_CLASS,
  selected ? 'border-accent bg-accent-soft text-accent-soft-text' : '',
];
</script>

<template>
  <AdminPageHeader
    :crumbs="[
      { label: $t('admin.organizations.crumbs.people') },
      { label: $t('admin.organizations.title') },
    ]"
    :title="$t('admin.organizations.title')"
    :lead="$t('admin.organizations.lead')"
  >
    <template #actions>
      <AdminBit placement="people" />
      <button
        v-if="canAdd && view === 'organizations'"
        type="button"
        :class="ADMIN_PRIMARY_CLASS"
        @click="startCreate"
      >
        {{ $t('admin.organizations.actions.create') }}
      </button>
    </template>
  </AdminPageHeader>
  <nav :aria-label="$t('admin.organizations.views.label')" class="flex flex-wrap gap-2">
    <RouterLink
      data-testid="view-organizations"
      :to="{ name: 'admin-organizations' }"
      :class="tabClass(view === 'organizations')"
      :aria-current="view === 'organizations' ? 'page' : undefined"
    >
      {{ $t('admin.organizations.views.organizations') }}
    </RouterLink>
    <RouterLink
      v-if="canSeeQueue"
      data-testid="view-requests"
      :to="{ name: 'admin-organizations', query: { view: 'requests' } }"
      :class="tabClass(view === 'requests')"
      :aria-current="view === 'requests' ? 'page' : undefined"
    >
      {{ $t('admin.organizations.views.requests') }}
      <span
        v-if="pendingTotal > 0"
        data-testid="pending-count"
        :aria-label="$t('admin.organizations.views.pending', { count: pendingTotal })"
        class="rounded-pill bg-accent-soft px-2 text-xs text-accent-soft-text"
        >{{ pendingTotal }}</span
      >
    </RouterLink>
  </nav>
  <AllRequestsPanel v-if="view === 'requests'" />
  <QueryState
    v-else
    :loading="organizations.isPending.value"
    :error="organizations.error.value"
    @retry="organizations.refetch()"
  >
    <template #skeleton><SkeletonBlock class="h-80 w-full" /></template>
    <div class="grid items-start gap-6" :class="{ 'lg:grid-cols-2': orgParam !== null }">
      <OrganizationList
        v-if="organizations.data.value"
        :items="organizations.data.value.items"
        :meta="organizations.data.value.meta"
        :selected="orgParam"
        :search="search"
        @search="searchFor"
      />
      <section v-if="orgParam !== null" class="flex min-w-0 flex-col gap-6">
        <OrganizationEditor :key="orgParam" :slug="editedSlug" />
        <OrganizationAdminPanels v-if="editedSlug !== null" :key="editedSlug" :slug="editedSlug" />
      </section>
    </div>
  </QueryState>
</template>
