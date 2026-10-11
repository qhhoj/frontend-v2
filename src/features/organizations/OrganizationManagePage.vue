<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { OrganizationDetail } from '@/api/types/organizations';
import StatePanel from '@/components/StatePanel.vue';
import JoinRequestsPanel from '@/features/admin/organizations/JoinRequestsPanel.vue';
import MembersPanel from '@/features/admin/organizations/MembersPanel.vue';
import OrganizationHistoryPanel from '@/features/admin/organizations/OrganizationHistoryPanel.vue';
import OrganizationInfoForm from './manage/OrganizationInfoForm.vue';
import { useOrganization } from './use-organization';

/**
 * "Quản lý" (variant A): legacy `EditOrganization`, the join requests and `KickUserWidgetView` for the organization's own
 * administrators, who need no staff permission. The form on the left, requests and members on the right, history below.
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
    <div class="grid items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <OrganizationInfoForm :key="organization.id" :slug="organization.slug" @saved="onSaved" />
      <div class="flex min-w-0 flex-col gap-6">
        <JoinRequestsPanel :key="`requests-${organization.slug}`" :slug="organization.slug" />
        <MembersPanel :key="`members-${organization.slug}`" :slug="organization.slug" />
      </div>
    </div>
    <OrganizationHistoryPanel :key="`history-${organization.slug}`" :slug="organization.slug" />
  </div>
</template>
