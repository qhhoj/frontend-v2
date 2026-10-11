<script setup lang="ts">
import { computed } from 'vue';
import type { OrganizationDetail } from '@/api/types/organizations';
import JoinRequestsPanel from '@/features/admin/organizations/JoinRequestsPanel.vue';
import MembersPanel from '@/features/admin/organizations/MembersPanel.vue';
import OrganizationHistoryPanel from '@/features/admin/organizations/OrganizationHistoryPanel.vue';
import ManageContestsCard from './ManageContestsCard.vue';
import ManageFold from './ManageFold.vue';
import ManageProblemsCard from './ManageProblemsCard.vue';
import ManageSummary from './ManageSummary.vue';
import OrganizationInfoForm from './OrganizationInfoForm.vue';
import { useManageLists } from './use-manage-lists';

/**
 * Mock-up 4A: legacy `EditOrganization`, the join requests and `KickUserWidgetView` on one screen. Summary and tiles on top;
 * pending requests (a one-line fold when there are none) and problems on the left; contests, a short member list, then
 * Settings and History folded on the right. One column below `xl`.
 */
const props = defineProps<{ organization: OrganizationDetail }>();
const emit = defineEmits<{ saved: [organization: OrganizationDetail] }>();
const { pending } = useManageLists(() => props.organization);
/** Folded only once the queue is known to be empty, so a loading page never flashes the fold. */
const hasNoPending = computed(() => pending.data.value?.meta.total === 0);
</script>

<template>
  <div data-testid="org-manage" class="flex flex-col gap-6">
    <ManageSummary :organization="organization" />
    <div class="grid items-start gap-6 xl:grid-cols-2">
      <div class="flex min-w-0 flex-col gap-6">
        <div id="org-requests" class="scroll-mt-24">
          <JoinRequestsPanel
            v-if="!hasNoPending"
            :key="`requests-${organization.slug}`"
            :slug="organization.slug"
          />
          <ManageFold
            v-else
            data-testid="requests-fold"
            :title="$t('admin.organizations.requests.title')"
            :lead="$t('orgs.manage.noPending')"
          >
            <JoinRequestsPanel
              :key="`requests-${organization.slug}`"
              :slug="organization.slug"
              embedded
            />
          </ManageFold>
        </div>
        <ManageProblemsCard :organization="organization" />
      </div>
      <div class="flex min-w-0 flex-col gap-6">
        <ManageContestsCard :organization="organization" />
        <MembersPanel :key="`members-${organization.slug}`" :slug="organization.slug" compact />
        <ManageFold
          data-testid="settings-fold"
          :title="$t('orgs.manage.settings.title')"
          :lead="$t('orgs.manage.settings.lead')"
        >
          <OrganizationInfoForm
            :key="organization.id"
            :slug="organization.slug"
            @saved="emit('saved', $event)"
          />
        </ManageFold>
        <ManageFold
          data-testid="history-fold"
          :title="$t('admin.organizations.history.title')"
          :lead="$t('admin.organizations.history.lead')"
        >
          <OrganizationHistoryPanel
            :key="`history-${organization.slug}`"
            :slug="organization.slug"
            embedded
          />
        </ManageFold>
      </div>
    </div>
  </div>
</template>
