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
 * administrators, who need no staff permission. What waits comes first (P-32 B): the join requests, at a readable
 * width with their bulk approve, then the members, the folded profile form, and the history.
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
    <!-- A readable width: at full width "Chấp nhận" sat ~1000 px from the requester's name. -->
    <JoinRequestsPanel
      :key="`requests-${organization.slug}`"
      class="max-w-3xl"
      :slug="organization.slug"
    />
    <MembersPanel :key="`members-${organization.slug}`" :slug="organization.slug" />
    <OrganizationInfoForm :key="organization.id" :slug="organization.slug" @saved="onSaved" />
    <OrganizationHistoryPanel :key="`history-${organization.slug}`" :slug="organization.slug" />
  </div>
</template>
