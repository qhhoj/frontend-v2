<script setup lang="ts">
import { Plus } from 'lucide-vue-next';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { OrganizationDetail as Organization } from '@/api/types/organizations';
import { pageFromQuery } from '@/lib/paging';
import { usePermissions } from '@/stores/use-permissions';
import { searchQueryOf } from '../search/index-search';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminTabs from '../ui/AdminTabs.vue';
import { buttonClass } from '../ui/controls';
import AllRequestsPanel from './AllRequestsPanel.vue';
import OrganizationDetail from './OrganizationDetail.vue';
import OrganizationList from './OrganizationList.vue';
import { useAdminOrganizationsQuery } from './organization-list.queries';
import {
  PER_ORGANIZATION_RESET,
  organizationFiltersOf,
  organizationSearchOf,
  organizationsViewOf,
} from './organization-search';
import { useOrganizationViewTabs } from './use-organization-view-tabs';

/**
 * `?org=<slug>` opens an organization beside the list (alone below 1280 px), `?org=new` the create form.
 * `?view=requests` is the join-request queue of every organization.
 */
const NEW_ORGANIZATION = 'new';
const route = useRoute();
const router = useRouter();
const { can } = usePermissions();
const { tabs: viewTabs, canSeeQueue } = useOrganizationViewTabs();
const view = computed(() => organizationsViewOf(route.query, canSeeQueue.value));
const orgParam = computed(() => (typeof route.query.org === 'string' ? route.query.org : null));
const editedSlug = computed(() => (orgParam.value === NEW_ORGANIZATION ? null : orgParam.value));
const page = computed(() => pageFromQuery(route.query.page));
const search = computed(() => organizationSearchOf(route.query));
const filters = computed(() => organizationFiltersOf(route.query));
const organizations = useAdminOrganizationsQuery(
  page,
  search,
  filters,
  () => view.value === 'organizations',
);
const canAdd = computed(() => can('judge.add_organization'));

/** Back to the list; awaited by a delete, so the deleted slug is not refetched into a 404. */
const closeDetail = () =>
  router.push({ query: { ...route.query, org: undefined, ...PER_ORGANIZATION_RESET } });

function startCreate() {
  void router.push({ query: { ...route.query, org: NEW_ORGANIZATION, ...PER_ORGANIZATION_RESET } });
}

/** A create or a renamed slug moves `?org=` to the saved organization. */
async function onSaved(saved: Organization) {
  if (saved.slug !== route.query.org)
    await router.push({ query: { ...route.query, org: saved.slug } });
}

function searchFor(text: string) {
  void router.replace({ query: searchQueryOf(route.query, { q: text }) });
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <AdminPageHeader
      :title="$t('admin.organizations.title')"
      :lead="$t('admin.organizations.lead')"
    >
      <template v-if="canAdd && view === 'organizations'" #actions>
        <button type="button" :class="buttonClass('primary')" @click="startCreate">
          <Plus aria-hidden="true" class="size-4" :stroke-width="1.75" />
          {{ $t('admin.organizations.actions.create') }}
        </button>
      </template>
    </AdminPageHeader>
    <AdminTabs
      v-if="viewTabs.length > 1"
      :tabs="viewTabs"
      :current="view"
      :label="$t('admin.organizations.views.label')"
    />
    <AllRequestsPanel v-if="view === 'requests'" />
    <div
      v-else
      class="grid items-start gap-5"
      :class="orgParam !== null && 'xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]'"
    >
      <OrganizationList
        :class="orgParam !== null && 'max-xl:hidden'"
        :items="organizations.data.value?.items ?? []"
        :meta="organizations.data.value?.meta"
        :loading="organizations.isPending.value"
        :error="organizations.error.value"
        :selected="orgParam"
        :search="search"
        :filters="filters"
        :compact="orgParam !== null"
        @search="searchFor"
        @retry="organizations.refetch()"
      />
      <OrganizationDetail
        v-if="orgParam !== null"
        :key="orgParam"
        :slug="editedSlug"
        :on-deleted="closeDetail"
        @saved="onSaved"
        @close="closeDetail"
      />
    </div>
  </div>
</template>
