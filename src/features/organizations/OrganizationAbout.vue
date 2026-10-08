<script setup lang="ts">
import { computed } from 'vue';
import EmptyState from '@/components/EmptyState.vue';
import UserContent from '@/components/UserContent.vue';
import UserName from '@/components/UserName.vue';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import OrganizationRecentPosts from './OrganizationRecentPosts.vue';
import OrganizationTopMembers from './OrganizationTopMembers.vue';
import { useOrganization } from './use-organization';

const { query } = useOrganization();
const organization = computed(() => query.data.value);
</script>

<template>
  <div v-if="organization" class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
    <div class="flex min-w-0 flex-col gap-6">
      <section class="glass rounded-card p-5 sm:p-7">
        <UserContent v-if="organization.aboutHtml" :html="organization.aboutHtml" />
        <EmptyState v-else>{{ $t('orgs.noAbout') }}</EmptyState>
      </section>
      <OrganizationRecentPosts />
    </div>
    <aside class="flex flex-col gap-6">
      <section data-testid="organization-admins" class="glass flex flex-col gap-3 rounded-card p-5">
        <h2 class="font-display text-lg font-semibold">{{ $t('orgs.admins') }}</h2>
        <ul class="flex flex-col gap-2">
          <li v-for="admin in organization.admins" :key="admin.id" class="flex items-center gap-2">
            <UserAvatar :username="admin.username" :size="28" />
            <UserName :username="admin.username" />
          </li>
        </ul>
      </section>
      <OrganizationTopMembers />
    </aside>
  </div>
</template>
