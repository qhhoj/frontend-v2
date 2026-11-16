<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import UserLink from '@/components/UserLink.vue';
import { computed } from 'vue';
import EmptyState from '@/components/EmptyState.vue';
import UserContent from '@/components/UserContent.vue';
import OrganizationManageCard from './OrganizationManageCard.vue';
import OrganizationRecentPosts from './OrganizationRecentPosts.vue';
import OrganizationTopMembers from './OrganizationTopMembers.vue';
import { useOrganization } from './use-organization';

const { query } = useOrganization();
const organization = computed(() => query.data.value);
const viewer = computed(() => organization.value?.viewer);
const showsManageCard = computed(
  () =>
    viewer.value?.canAdminister === true ||
    viewer.value?.canCreateProblem === true ||
    viewer.value?.canCreateContest === true,
);
</script>

<template>
  <div v-if="organization" class="grid items-start gap-5 lg:grid-cols-3">
    <!-- 1B: right column on desktop, first under the header on a phone. -->
    <OrganizationManageCard
      v-if="showsManageCard"
      :organization="organization"
      class="lg:col-start-3 lg:row-start-1"
    />
    <div class="flex min-w-0 flex-col gap-5 lg:col-span-2 lg:row-span-2 lg:row-start-1">
      <Card
        v-if="organization.aboutHtml || viewer?.canAdminister"
        class="flex flex-col gap-3 p-5 sm:p-6"
      >
        <h2 class="font-display text-base font-bold text-accent-text">{{ $t('orgs.about') }}</h2>
        <UserContent v-if="organization.aboutHtml" :html="organization.aboutHtml" />
        <EmptyState v-else>{{ $t('orgs.noAbout') }}</EmptyState>
      </Card>
      <OrganizationRecentPosts :keeps-empty="viewer?.canAdminister === true" />
    </div>
    <aside class="flex min-w-0 flex-col gap-5 lg:col-start-3">
      <Card
        v-if="organization.admins.length"
        data-testid="organization-admins"
        padding="md"
        class="flex flex-col gap-3"
      >
        <h2 class="font-display text-base font-bold text-accent-text">{{ $t('orgs.admins') }}</h2>
        <ul class="flex flex-col gap-2">
          <li v-for="admin in organization.admins" :key="admin.id" class="flex items-center gap-2">
            <UserLink :username="admin.username" :rating="admin.rating" size="sm" />
          </li>
        </ul>
      </Card>
      <OrganizationTopMembers v-if="organization.memberCount > 0" />
    </aside>
  </div>
</template>
