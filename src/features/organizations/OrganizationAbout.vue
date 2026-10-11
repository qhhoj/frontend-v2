<script setup lang="ts">
import UserLink from '@/components/UserLink.vue';
import { computed } from 'vue';
import EmptyState from '@/components/EmptyState.vue';
import UserContent from '@/components/UserContent.vue';
import OrganizationRecentPosts from './OrganizationRecentPosts.vue';
import OrganizationTopMembers from './OrganizationTopMembers.vue';
import { useOrganization } from './use-organization';

const { query } = useOrganization();
const organization = computed(() => query.data.value);
</script>

<template>
  <div v-if="organization" class="grid items-start gap-5 lg:grid-cols-3">
    <div class="flex min-w-0 flex-col gap-5 lg:col-span-2">
      <section class="glass flex flex-col gap-3 rounded-card p-5 sm:p-6">
        <h2 class="font-display text-base font-bold text-accent-text">{{ $t('orgs.about') }}</h2>
        <UserContent v-if="organization.aboutHtml" :html="organization.aboutHtml" />
        <EmptyState v-else>{{ $t('orgs.noAbout') }}</EmptyState>
      </section>
      <OrganizationRecentPosts />
    </div>
    <aside class="flex min-w-0 flex-col gap-5">
      <section data-testid="organization-admins" class="glass flex flex-col gap-3 rounded-card p-5">
        <h2 class="font-display text-base font-bold text-accent-text">{{ $t('orgs.admins') }}</h2>
        <ul class="flex flex-col gap-2">
          <li v-for="admin in organization.admins" :key="admin.id" class="flex items-center gap-2">
            <UserLink :username="admin.username" :rating="admin.rating" size="sm" />
          </li>
        </ul>
      </section>
      <OrganizationTopMembers />
    </aside>
  </div>
</template>
