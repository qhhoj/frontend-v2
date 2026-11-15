<script setup lang="ts">
import { computed } from 'vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { useOrganization } from './use-organization';
import { useMembersQuery } from './organizations.queries';
import MemberRows from './MemberRows.vue';

const TOP_MEMBERS = { sort: 'performancePoints', page: 1, pageSize: 5 } as const;
const { slug } = useOrganization();
const query = useMembersQuery(slug, TOP_MEMBERS);
const members = computed(() => query.data.value?.items ?? []);
</script>

<template>
  <section data-testid="top-members" class="flex flex-col gap-2">
    <div class="flex items-baseline justify-between gap-3">
      <h2 class="section-title">{{ $t('orgs.topMembers') }}</h2>
      <RouterLink
        :to="{ name: 'organization-members', params: { slug } }"
        class="text-sm font-semibold text-accent-text hover:underline"
      >
        {{ $t('orgs.allMembers') }}
      </RouterLink>
    </div>
    <QueryState
      :loading="query.isPending.value"
      :error="query.error.value"
      @retry="query.refetch()"
    >
      <template #skeleton>
        <div class="flex flex-col gap-3">
          <SkeletonBlock v-for="row in 5" :key="row" text class="h-6 w-full" />
        </div>
      </template>
      <MemberRows :members="members" :columns="['performancePoints']" />
    </QueryState>
  </section>
</template>
