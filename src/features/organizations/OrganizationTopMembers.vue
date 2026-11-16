<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
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
  <Card data-testid="top-members" padding="md" class="flex flex-col gap-3">
    <h2 class="font-display text-base font-bold text-accent-text">{{ $t('orgs.topMembers') }}</h2>
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
    <RouterLink
      :to="{ name: 'organization-members', params: { slug } }"
      class="font-semibold text-accent-text hover:underline"
    >
      {{ $t('orgs.allMembers') }}
    </RouterLink>
  </Card>
</template>
