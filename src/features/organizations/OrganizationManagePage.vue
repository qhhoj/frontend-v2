<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { OrganizationDetail } from '@/api/types/organizations';
import StatePanel from '@/components/StatePanel.vue';
import ManageDashboard from './manage/ManageDashboard.vue';
import { useOrganization } from './use-organization';

/** "Quản lý": the organization's own administrators (no staff permission needed) get the dashboard; others a 403 panel. */
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
  <ManageDashboard v-else-if="organization" :organization="organization" @saved="onSaved" />
</template>
