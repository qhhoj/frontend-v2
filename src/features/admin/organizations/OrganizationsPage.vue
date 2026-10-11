<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import type { OrganizationDetail } from '@/api/types/organizations';
import { pageFromQuery } from '@/lib/paging';
import { usePermissions } from '@/stores/use-permissions';
import AdminBit from '../shell/AdminBit.vue';
import { searchQueryOf } from '../search/index-search';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminFilterTabs from '../ui/AdminFilterTabs.vue';
import { ADMIN_PRIMARY_CLASS } from '../ui/classes';
import AllRequestsPanel from './AllRequestsPanel.vue';
import OrganizationAdminPanels from './OrganizationAdminPanels.vue';
import OrganizationDeleteCard from './OrganizationDeleteCard.vue';
import OrganizationEditor from './OrganizationEditor.vue';
import OrganizationList from './OrganizationList.vue';
import { useAdminOrganizationsQuery } from './organization-list.queries';
import {
  organizationFiltersOf,
  organizationSearchOf,
  organizationsViewOf,
} from './organization-search';
import { useOrganizationViewTabs } from './use-organization-view-tabs';

/** `?org=<slug>` edits an organization, `?org=new` creates one; neither names one. */
const NEW_ORGANIZATION = 'new';
const route = useRoute();
const router = useRouter();
const { can, isSuperuser } = usePermissions();
const { tabs: viewTabs, canSeeQueue } = useOrganizationViewTabs();
const view = computed(() => organizationsViewOf(route.query, canSeeQueue.value));
const orgParam = computed(() => (typeof route.query.org === 'string' ? route.query.org : null));
const isCreating = computed(() => orgParam.value === NEW_ORGANIZATION);
const editedSlug = computed(() =>
  orgParam.value === null || isCreating.value ? null : orgParam.value,
);
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
/** Back to the list, so the deleted slug is not refetched into a 404. */
async function onDeleted() {
  await router.push({ query: { ...route.query, org: undefined } });
}

function startCreate() {
  void router.push({ query: { ...route.query, org: NEW_ORGANIZATION } });
}

/** A create or a renamed slug moves `?org=` to the saved organization. */
async function onSaved(saved: OrganizationDetail) {
  if (saved.slug !== route.query.org)
    await router.push({ query: { ...route.query, org: saved.slug } });
}

function searchFor(text: string) {
  void router.replace({ query: searchQueryOf(route.query, { q: text }) });
}
</script>

<template>
  <AdminPageHeader :title="$t('admin.organizations.title')" :lead="$t('admin.organizations.lead')">
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
  <AdminFilterTabs
    :tabs="viewTabs"
    :current="view"
    :label="$t('admin.organizations.views.label')"
  />
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
        :filters="filters"
        @search="searchFor"
      />
      <section v-if="orgParam !== null" class="flex min-w-0 flex-col gap-6">
        <OrganizationEditor :key="orgParam" :slug="editedSlug" @saved="onSaved" />
        <OrganizationAdminPanels v-if="editedSlug !== null" :key="editedSlug" :slug="editedSlug" />
        <OrganizationDeleteCard
          v-if="isSuperuser && editedSlug !== null"
          :key="`delete-${editedSlug}`"
          :slug="editedSlug"
          :on-deleted="onDeleted"
        />
      </section>
    </div>
  </QueryState>
</template>
