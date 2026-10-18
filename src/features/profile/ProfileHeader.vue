<script setup lang="ts">
import { computed } from 'vue';
import type { UserPage } from '@/api/types/users';
import AdminEditLink from '@/features/admin/edit-link/AdminEditLink.vue';
import { userEditTarget } from '@/features/admin/edit-link/admin-edit-targets';
import AppButton from '@/components/ui/AppButton.vue';
import Card from '@/components/ui/Card.vue';
import Chip from '@/components/ui/Chip.vue';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import { formatNumber } from '@/lib/format';
import { formatDate } from '@/lib/format-date';
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
const editTarget = computed(() => userEditTarget(session.user, props.user.username));
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
const joinedDate = computed(() => formatDate(props.user.dateJoined, 'date', locale.locale));
</script>

<template>
  <Card
    data-testid="profile-header"
    class="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_16rem] md:p-8"
  >
    <div class="flex min-w-0 flex-col gap-4">
      <div class="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <UserAvatar :username="user.username" :size="96" />
        <div class="flex min-w-0 flex-col gap-1.5">
          <div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <h1 :class="tierClass" class="page-title break-all">
              {{ user.username }}
            </h1>
            <span
              :class="tierClass"
              class="rounded-pill border border-line px-2.5 py-0.5 text-xs font-semibold"
            >
              {{ $t(tierLabelKey) }}
            </span>
            <Chip v-if="isOwn" tone="accent">{{ $t('profile.own') }}</Chip>
          </div>
          <p class="text-muted">
            {{ $t('profile.joined', { name: user.displayName, date: joinedDate }) }}
          </p>
          <ul v-if="user.organizations.length" class="mt-1 flex flex-wrap gap-1.5">
            <li v-for="organization in user.organizations" :key="organization.id">
              <RouterLink
                :to="{ name: 'organization', params: { slug: organization.slug } }"
                :title="organization.name"
                class="inline-flex items-center rounded-pill border border-line px-2.5 py-0.5 text-xs font-semibold hover:bg-surface-hover"
              >
                {{ organization.shortName }}
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>
      <div v-if="isOwn || canBan || isSignedIn" class="flex flex-wrap items-center gap-2.5">
        <template v-if="isOwn">
          <AppButton tone="primary" to="/settings">{{ $t('profile.edit') }}</AppButton>
          <AppButton to="/blog/new">{{ $t('profile.write') }}</AppButton>
        </template>
        <BanUserDialog v-else-if="canBan" :key="user.username" :username="user.username" />
        <AdminEditLink :to="editTarget" />
        <ShortLinkButton :path="shortLinkPath({ kind: 'user', username: user.username })" />
      </div>
      <p v-if="banReason" data-testid="ban-status" class="text-sm text-negative">
        {{ $t('profile.ban.bannedWithReason', { reason: banReason }) }}
      </p>
    </div>
    <div data-testid="rating-box" :class="RATING_BOX_CLASSES">
      <!-- Q-03 B: without a rating the box leads with the problems solved, a number a new student can raise every day. -->
      <template v-if="user.rating === null">
        <p class="text-sm text-muted">{{ $t('profile.solvedLead') }}</p>
        <p data-testid="rating-figure" class="font-display text-4xl font-semibold">
          {{ formatNumber(user.problemCount, locale.locale) }}
        </p>
      </template>
      <template v-else>
        <p class="text-sm text-muted">{{ $t('profile.rating') }}</p>
        <p
          data-testid="rating-figure"
          :class="tierClass"
          class="font-display text-4xl font-semibold"
        >
          {{ user.rating }}
        </p>
      </template>
      <p v-if="user.rating !== null && user.ratingSummary" class="min-h-10 text-sm text-muted">
        {{
          $t('profile.ratingSummary', {
            max: user.ratingSummary.max,
            min: user.ratingSummary.min,
            count: user.ratingSummary.contests,
          })
        }}
      </p>
    </div>
  </Card>
</template>
