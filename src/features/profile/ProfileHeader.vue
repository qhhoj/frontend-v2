<script setup lang="ts">
import { computed } from 'vue';
import type { UserPage } from '@/api/types/users';
import GlassCard from '@/components/GlassCard.vue';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import { formatNumericDate } from '@/lib/format';
import { hasPermission } from '@/lib/permissions';
import { ratingTier, tierColor } from '@/lib/rating-tiers';
import { TIER_TEXT_CLASSES } from '@/lib/tier-classes';
import { useLocaleStore } from '@/stores/locale.store';
import ShortLinkButton from '@/features/short-links/ShortLinkButton.vue';
import { shortLinkPath } from '@/features/short-links/short-link-path';
import { useSessionStore } from '@/stores/session.store';
import BanUserDialog from './BanUserDialog.vue';
import { RATING_BOX_CLASSES } from './profile-geometry';

const props = defineProps<{ user: UserPage }>();
const session = useSessionStore();
const locale = useLocaleStore();

const tier = computed(() => ratingTier(props.user.rating));
const tierClass = computed(() => TIER_TEXT_CLASSES[tierColor(tier.value)]);
const tierLabelKey = computed(() => `tiers.${tier.value ?? 'unrated'}`);
const isOwn = computed(() => props.user.username === session.user?.username);
const banReason = computed(() => props.user.staff?.banReason ?? null);
/** The backend refuses to ban a superuser, an account already banned (409) or oneself: offer the action only where it can work. */
const canBan = computed(
  () =>
    hasPermission(session.user, 'judge.ban_user') &&
    !isOwn.value &&
    !props.user.staff?.isSuperuser &&
    !banReason.value,
);
const isSignedIn = computed(() => session.status === 'authenticated');
const joinedDate = computed(() => formatNumericDate(props.user.dateJoined, locale.locale));
</script>

<template>
  <GlassCard
    data-testid="profile-header"
    class="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_16rem] md:p-8"
  >
    <div class="flex min-w-0 flex-col gap-4">
      <div class="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
        <UserAvatar :username="user.username" :size="96" />
        <div class="flex min-w-0 flex-col gap-2">
          <p class="flex flex-wrap items-center gap-2 text-sm">
            <span
              :class="tierClass"
              class="rounded-pill border border-line px-3 py-0.5 font-semibold"
            >
              {{ $t(tierLabelKey) }}
            </span>
            <span
              v-if="isOwn"
              class="rounded-pill bg-accent-soft px-3 py-0.5 font-semibold text-accent-soft-text"
            >
              {{ $t('profile.own') }}
            </span>
          </p>
          <h1 :class="tierClass" class="page-title break-all">
            {{ user.username }}
          </h1>
          <p class="text-muted">
            {{ $t('profile.joined', { name: user.displayName, date: joinedDate }) }}
          </p>
          <ul v-if="user.organizations.length" class="flex flex-wrap gap-2">
            <li v-for="organization in user.organizations" :key="organization.id">
              <RouterLink
                :to="{ name: 'organization', params: { slug: organization.slug } }"
                :title="organization.name"
                class="inline-flex min-h-8 items-center rounded-pill border border-line px-3 text-sm font-semibold hover:bg-surface-hover"
              >
                {{ organization.shortName }}
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>
      <div v-if="isOwn || canBan || isSignedIn" class="flex flex-wrap gap-2.5">
        <template v-if="isOwn">
          <RouterLink
            to="/settings"
            class="inline-flex min-h-11 items-center rounded-pill bg-gradient-accent px-5 font-semibold text-on-accent"
          >
            {{ $t('profile.edit') }}
          </RouterLink>
          <RouterLink
            to="/blog/new"
            class="inline-flex min-h-11 items-center rounded-pill border border-line px-5 font-semibold hover:bg-surface-hover"
          >
            {{ $t('profile.write') }}
          </RouterLink>
        </template>
        <BanUserDialog v-else-if="canBan" :key="user.username" :username="user.username" />
        <ShortLinkButton :path="shortLinkPath({ kind: 'user', username: user.username })" />
      </div>
      <p v-if="banReason" data-testid="ban-status" class="text-sm text-negative">
        {{ $t('profile.ban.bannedWithReason', { reason: banReason }) }}
      </p>
    </div>
    <div data-testid="rating-box" :class="RATING_BOX_CLASSES">
      <p class="text-sm text-muted">{{ $t('profile.rating') }}</p>
      <p :class="tierClass" class="font-display text-4xl font-semibold">{{ user.rating ?? '—' }}</p>
      <p v-if="user.ratingSummary" class="min-h-10 text-sm text-muted">
        {{
          $t('profile.ratingSummary', {
            max: user.ratingSummary.max,
            min: user.ratingSummary.min,
            count: user.ratingSummary.contests,
          })
        }}
      </p>
    </div>
  </GlassCard>
</template>
