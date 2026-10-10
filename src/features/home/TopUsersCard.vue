<script setup lang="ts">
import EmptyState from '@/components/EmptyState.vue';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import UserName from '@/components/UserName.vue';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import { useTopUsersQuery } from '@/features/users/users.queries';

const { data: users, isPending, error, refetch } = useTopUsersQuery();
/**
 * The three-row skeleton is 92 px, a row shorter than the compact empty message (102.5 px). Every state reserves
 * the taller of the two, so the card keeps its height from skeleton to loaded list and to the empty message.
 */
const LIST_MIN_HEIGHT = 'min-h-[6.4rem]';
</script>

<template>
  <GlassCard data-testid="top-users" class="p-6">
    <h2 class="mb-3 font-display text-base font-bold">{{ $t('home.topRating') }}</h2>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <ol class="flex flex-col gap-2.5" :class="LIST_MIN_HEIGHT">
          <li v-for="row in 3" :key="row" class="flex items-center gap-2.5">
            <SkeletonBlock class="size-6 shrink-0" />
            <span class="flex-1"><SkeletonBlock text class="w-2/3" /></span>
            <span class="font-mono"><SkeletonBlock text class="w-10" /></span>
          </li>
        </ol>
      </template>

      <EmptyState v-if="!users?.length" compact :class="LIST_MIN_HEIGHT">{{
        $t('home.noUsers')
      }}</EmptyState>
      <ol v-else class="flex flex-col gap-2.5" :class="LIST_MIN_HEIGHT">
        <li v-for="entry in users" :key="entry.id" class="flex items-center gap-2.5">
          <UserAvatar :username="entry.username" :size="24" />
          <UserName class="flex-1" :username="entry.username" :rating="entry.rating" />
          <span class="font-mono tabular-nums">{{ entry.rating ?? '—' }}</span>
        </li>
      </ol>
    </QueryState>
  </GlassCard>
</template>
