<script setup lang="ts">
import { computed, ref } from 'vue';
import type { UserPage } from '@/api/types/users';
import AdminEditLink from '@/features/admin/edit-link/AdminEditLink.vue';
import { userEditTarget } from '@/features/admin/edit-link/admin-edit-targets';
import UnbanUserDialog from '@/features/admin/users/UnbanUserDialog.vue';
import AppButton from '@/components/ui/AppButton.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import Chip from '@/components/ui/Chip.vue';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { formatDate } from '@/lib/format-date';
import { hasPermission } from '@/lib/permissions';
import { ratingTier, tierColor } from '@/lib/rating-tiers';
import { TIER_TEXT_CLASSES, ratingTextClass } from '@/lib/tier-classes';
import { isBannedPage } from '@/lib/user-ban';
import { useLocaleStore } from '@/stores/locale.store';
import ShortLinkButton from '@/features/short-links/ShortLinkButton.vue';
import { shortLinkPath } from '@/features/short-links/short-link-path';
import { useSessionStore } from '@/stores/session.store';
import BanUserDialog from './BanUserDialog.vue';

const props = defineProps<{ user: UserPage }>();
const session = useSessionStore();
const locale = useLocaleStore();

const tier = computed(() => ratingTier(props.user.rating));
const tierClass = computed(() => TIER_TEXT_CLASSES[tierColor(tier.value)]);
const tierLabelKey = computed(() => `tiers.${tier.value ?? 'unrated'}`);
const editTarget = computed(() => userEditTarget(session.user, props.user.username));
const isOwn = computed(() => props.user.username === session.user?.username);
const banReason = computed(() => props.user.staff?.banReason ?? null);
const isBanned = computed(() => isBannedPage(props.user));
const canModerate = computed(() => hasPermission(session.user, 'judge.ban_user') && !isOwn.value);
/** The backend refuses to ban a superuser, an account already banned (409) or oneself: offer the action only where it can work. */
const canBan = computed(
  () => canModerate.value && !props.user.staff?.isSuperuser && !isBanned.value,
);
/** The inverse of the ban, for the same permission: unbanning an account that is not banned is a 409. */
const canUnban = computed(() => canModerate.value && isBanned.value);
const isUnbanOpen = ref(false);
const joinedDate = computed(() => formatDate(props.user.dateJoined, 'date', locale.locale));
/** The display name only when it adds something: it is often the username again. */
const joinedLine = computed(() =>
  props.user.displayName === props.user.username
    ? translate('profile.joinedDate', { date: joinedDate.value })
    : translate('profile.joined', { name: props.user.displayName, date: joinedDate.value }),
);
</script>

<template>
  <PageHeader
    data-testid="profile-header"
    :title="user.username"
    :title-class="ratingTextClass(user.rating)"
    :crumbs="[{ label: $t('nav.users'), to: '/users' }]"
    :back="{ to: '/users', label: $t('nav.users') }"
  >
    <template #start>
      <UserAvatar class="max-sm:hidden" :username="user.username" :size="96" />
      <UserAvatar class="sm:hidden" :username="user.username" :size="32" />
    </template>
    <template #meta>
      <span :class="tierClass">{{ $t(tierLabelKey) }}</span>
      <span aria-hidden="true">·</span>
      <span>{{ joinedLine }}</span>
      <Chip v-if="isOwn" tone="accent">{{ $t('profile.own') }}</Chip>
    </template>
    <template v-if="banReason || canUnban" #lead>
      <p data-testid="ban-status" class="text-negative">
        {{
          banReason
            ? $t('profile.ban.bannedWithReason', { reason: banReason })
            : $t('profile.ban.banned')
        }}
      </p>
    </template>
    <template #actions>
      <!-- Without a rating the figure is the problems solved, a number a new student can raise every day. -->
      <div data-testid="rating-box" class="w-full md:text-right">
        <p
          data-testid="rating-figure"
          :class="user.rating === null ? undefined : tierClass"
          class="font-display text-stat leading-9 font-semibold"
        >
          {{ user.rating === null ? formatNumber(user.problemCount, locale.locale) : user.rating }}
        </p>
        <p v-if="user.rating === null" class="text-caption text-muted">
          {{ $t('profile.solvedLead') }}
        </p>
        <p v-else-if="user.ratingSummary" class="text-caption text-muted">
          {{
            $t('profile.ratingSummary', {
              max: user.ratingSummary.max,
              min: user.ratingSummary.min,
              count: user.ratingSummary.contests,
            })
          }}
        </p>
      </div>
      <template v-if="isOwn">
        <AppButton tone="primary" to="/settings">{{ $t('profile.edit') }}</AppButton>
        <AppButton to="/blog/new">{{ $t('profile.write') }}</AppButton>
      </template>
      <BanUserDialog v-else-if="canBan" :key="user.username" :username="user.username" />
      <template v-else-if="canUnban">
        <AppButton data-testid="unban-open" @click="isUnbanOpen = true">
          {{ $t('profile.ban.unban') }}
        </AppButton>
        <UnbanUserDialog
          :key="user.username"
          v-model:visible="isUnbanOpen"
          :username="user.username"
        />
      </template>
      <AdminEditLink :to="editTarget" />
      <ShortLinkButton :path="shortLinkPath({ kind: 'user', username: user.username })" />
    </template>
  </PageHeader>
</template>
