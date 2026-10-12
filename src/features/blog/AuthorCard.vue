<script setup lang="ts">
import { computed } from 'vue';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AppButton from '@/components/ui/AppButton.vue';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import { useUserPageQuery } from '@/features/users/users.queries';
import { ratingTier, tierColor } from '@/lib/rating-tiers';
import { TIER_TEXT_CLASSES } from '@/lib/tier-classes';

/**
 * The post's author: avatar, name in the rating tier's colour, the tier written out, and the link to the profile.
 * The name is plain text, not a UserName link, so "Xem hồ sơ" is the card's only link to the profile.
 */
const props = defineProps<{ username: string }>();
const { data: user, isPending, error, refetch } = useUserPageQuery(() => props.username);
const tier = computed(() => ratingTier(user.value?.rating ?? null));
const nameClass = computed(() => TIER_TEXT_CLASSES[tierColor(tier.value)]);
const tierLabelKey = computed(() => `tiers.${tier.value ?? 'unrated'}`);
</script>

<template>
  <GlassCard data-testid="author-card" class="flex flex-col gap-4 p-4 sm:p-5">
    <h2 class="font-display text-base font-bold">{{ $t('blogPost.author') }}</h2>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <div class="flex items-center gap-3">
          <SkeletonBlock round class="size-8 shrink-0" />
          <div class="flex flex-col gap-1.5">
            <SkeletonBlock pill class="h-4 w-24" />
            <SkeletonBlock pill class="h-3 w-16" />
          </div>
        </div>
        <SkeletonBlock pill class="h-11 w-full" />
      </template>
      <div class="flex items-center gap-3">
        <UserAvatar :username="username" :size="32" />
        <div class="flex min-w-0 flex-col">
          <span :class="nameClass" class="font-semibold [overflow-wrap:anywhere]">
            {{ username }}
          </span>
          <span class="text-sm text-muted">{{ $t(tierLabelKey) }}</span>
        </div>
      </div>
      <AppButton :to="{ name: 'user', params: { username } }" block>
        {{ $t('blogPost.viewProfile') }}
      </AppButton>
    </QueryState>
  </GlassCard>
</template>
