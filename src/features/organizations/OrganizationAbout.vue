<script setup lang="ts">
import UserLink from '@/components/UserLink.vue';
import { computed } from 'vue';
import EmptyState from '@/components/EmptyState.vue';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import OrganizationAboutText from './OrganizationAboutText.vue';
import OrganizationManageCard from './OrganizationManageCard.vue';
import OrganizationRecentPosts from './OrganizationRecentPosts.vue';
import OrganizationTopMembers from './OrganizationTopMembers.vue';
import { useOrganization } from './use-organization';

/**
 * The default tab: one main column of plain sections: the manager's shortcuts, the about text (cut to a few lines),
 * the administrators on one line, the newest posts and the top members as compact rows.
 */
const { query } = useOrganization();
const locale = useLocaleStore();
const organization = computed(() => query.data.value);
const viewer = computed(() => organization.value?.viewer);
const founded = computed(() =>
  organization.value ? formatDate(organization.value.createdAt, 'date', locale.locale) : '',
);
const showsManageCard = computed(
  () =>
    viewer.value?.canAdminister === true ||
    viewer.value?.canCreateProblem === true ||
    viewer.value?.canCreateContest === true,
);
</script>

<template>
  <div v-if="organization" class="flex max-w-4xl min-w-0 flex-col gap-5">
    <OrganizationManageCard v-if="showsManageCard" :organization="organization" />
    <section class="flex flex-col gap-2" :aria-label="$t('orgs.about')">
      <template v-if="organization.aboutHtml || viewer?.canAdminister">
        <h2 class="section-title">{{ $t('orgs.about') }}</h2>
        <OrganizationAboutText v-if="organization.aboutHtml" :html="organization.aboutHtml" />
        <EmptyState v-else compact>{{ $t('orgs.noAbout') }}</EmptyState>
      </template>
      <p class="flex flex-wrap items-center gap-x-2 text-meta text-muted">
        <span>{{ $t('orgs.founded', { date: founded }) }}</span>
        <template v-if="organization.admins.length">
          <span aria-hidden="true">·</span>
          <span data-testid="organization-admins" class="flex flex-wrap items-center gap-x-2">
            {{ $t('orgs.admins') }}:
            <UserLink
              v-for="admin in organization.admins"
              :key="admin.id"
              :username="admin.username"
              :rating="admin.rating"
              size="sm"
            />
          </span>
        </template>
      </p>
    </section>
    <OrganizationRecentPosts :keeps-empty="viewer?.canAdminister === true" />
    <OrganizationTopMembers v-if="organization.memberCount > 0" />
  </div>
</template>
