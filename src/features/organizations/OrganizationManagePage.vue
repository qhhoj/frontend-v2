<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { OrganizationDetail } from '@/api/types/organizations';
import StatePanel from '@/components/StatePanel.vue';
import OrganizationAdminPanels from '@/features/admin/organizations/OrganizationAdminPanels.vue';
import OrganizationEditor from '@/features/admin/organizations/OrganizationEditor.vue';
import { useOrganization } from './use-organization';

/**
 * Legacy `EditOrganization` and `KickUserWidgetView` for an organization's own administrators, who need no staff
 * permission: the edit form, the members (remove), and the change history. Join requests have their own tab.
 */
const router = useRouter();
const { slug, query } = useOrganization();
const organization = computed(() => query.data.value);
const canAdminister = computed(() => organization.value?.viewer?.canAdminister === true);

/** A changed slug moves the page to the organization's new address. */
async function onSaved(saved: OrganizationDetail) {
  if (saved.slug !== slug.value)
    await router.replace({ name: 'organization-manage', params: { slug: saved.slug } });
}
</script>

<template>
  <StatePanel
    v-if="organization && !canAdminister"
    kind="forbidden"
    :title="$t('orgMembership.forbiddenTitle')"
  />
  <div v-else-if="organization" data-testid="org-manage" class="flex flex-col gap-6">
    <OrganizationEditor :key="organization.id" :slug="organization.slug" @saved="onSaved" />
    <OrganizationAdminPanels
      :key="organization.slug"
      :slug="organization.slug"
      :with-requests="false"
    />
  </div>
</template>
