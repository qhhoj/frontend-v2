<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { useOrganizationsQuery } from '@/features/organizations/organizations.queries';
import { pageFromQuery } from '@/lib/paging';
import { usePermissions } from '@/stores/use-permissions';
import AdminBit from '../shell/AdminBit.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import { ADMIN_PRIMARY_CLASS } from '../ui/classes';
import JoinRequestsPanel from './JoinRequestsPanel.vue';
import MembersPanel from './MembersPanel.vue';
import OrganizationEditor from './OrganizationEditor.vue';
import OrganizationList from './OrganizationList.vue';

/** `?org=<slug>` edits an organization, `?org=new` creates one; neither names one. */
const NEW_ORGANIZATION = 'new';
const route = useRoute();
const router = useRouter();
const { can } = usePermissions();
const orgParam = computed(() => (typeof route.query.org === 'string' ? route.query.org : null));
const isCreating = computed(() => orgParam.value === NEW_ORGANIZATION);
const editedSlug = computed(() =>
  orgParam.value === null || isCreating.value ? null : orgParam.value,
);
const page = computed(() => pageFromQuery(route.query.page));
const organizations = useOrganizationsQuery(page);
const canAdd = computed(() => can('judge.add_organization'));

function startCreate() {
  void router.push({ query: { ...route.query, org: NEW_ORGANIZATION } });
}
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
      <button v-if="canAdd" type="button" :class="ADMIN_PRIMARY_CLASS" @click="startCreate">
        {{ $t('admin.organizations.actions.create') }}
      </button>
    </template>
  </AdminPageHeader>
  <QueryState
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
      />
      <section v-if="orgParam !== null" class="flex min-w-0 flex-col gap-6">
        <OrganizationEditor :key="orgParam" :slug="editedSlug" />
        <template v-if="editedSlug !== null">
          <JoinRequestsPanel :key="`requests-${editedSlug}`" :slug="editedSlug" />
          <MembersPanel :key="`members-${editedSlug}`" :slug="editedSlug" />
        </template>
      </section>
    </div>
  </QueryState>
</template>
