<script setup lang="ts">
import EmptyState from '@/components/EmptyState.vue';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import TokenCoin from '@/components/TokenCoin.vue';
import UserName from '@/components/UserName.vue';
import { useTopUsersQuery } from '@/features/users/users.queries';

const { data: users, isPending, error, refetch } = useTopUsersQuery();
</script>

<template>
  <GlassCard data-testid="top-users" class="p-6">
    <h2 class="mb-3 font-display text-lg font-semibold">{{ $t('home.topRating') }}</h2>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <ol class="flex flex-col gap-2.5">
          <li v-for="row in 3" :key="row" class="flex items-center gap-2.5">
            <SkeletonBlock round class="size-7 shrink-0" />
            <span class="flex-1"><SkeletonBlock text class="w-2/3" /></span>
            <span class="font-mono"><SkeletonBlock text class="w-10" /></span>
          </li>
        </ol>
      </template>

      <EmptyState v-if="!users?.length" compact>{{ $t('home.noUsers') }}</EmptyState>
      <ol v-else class="flex flex-col gap-2.5">
        <li v-for="entry in users" :key="entry.id" class="flex items-center gap-2.5">
          <TokenCoin :seed="entry.username" size="sm" />
          <UserName class="flex-1" :username="entry.username" :rating="entry.rating" />
          <span class="font-mono tabular-nums">{{ entry.rating ?? '—' }}</span>
        </li>
      </ol>
    </QueryState>
  </GlassCard>
</template>
