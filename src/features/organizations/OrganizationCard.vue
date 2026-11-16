<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import type { OrganizationListItem } from '@/api/types/organizations';
import AppButton from '@/components/ui/AppButton.vue';
import Chip from '@/components/ui/Chip.vue';
import { formatNumber } from '@/lib/format';
import { medalClass } from '@/lib/medal';
import { safeRedirect } from '@/router/safe-redirect';
import { useLocaleStore } from '@/stores/locale.store';
import OrganizationJoinChip from './OrganizationJoinChip.vue';
import OrganizationLogo from './OrganizationLogo.vue';

const props = defineProps<{
  organization: OrganizationListItem;
  rank: number;
  isMember: boolean;
  isSignedIn: boolean;
}>();
const route = useRoute();
const locale = useLocaleStore();
const memberCount = computed(() => formatNumber(props.organization.memberCount, locale.locale));
const performancePoints = computed(() =>
  formatNumber(props.organization.performancePoints, locale.locale),
);
const organizationRoute = computed(() => ({
  name: 'organization',
  params: { slug: props.organization.slug },
}));
/** Joining happens on the organization page; a visitor first signs in and comes back to this list. */
const actionRoute = computed(() =>
  props.isSignedIn || props.isMember
    ? organizationRoute.value
    : { name: 'login', query: { redirect: safeRedirect(route.fullPath) } },
);
const actionKey = computed(() => {
  if (props.isMember) return 'orgs.act.joined';
  if (!props.isSignedIn) return 'orgs.act.signIn';
  return props.organization.isOpen ? 'orgs.act.join' : 'orgs.act.request';
});
/** Only "join" (an open organization) is the primary action; the rest are secondary. */
const actionTone = computed(() =>
  !props.isMember && props.isSignedIn && props.organization.isOpen ? 'primary' : 'secondary',
);
</script>

<template>
  <Card as="article" data-testid="organization-card" padding="md" class="flex flex-col gap-3.5">
    <div class="flex min-w-0 items-center gap-3">
      <OrganizationLogo :organization="organization" />
      <div class="min-w-0 flex-1">
        <h3 class="truncate font-bold">
          <RouterLink :to="organizationRoute" class="hover:underline">
            {{ organization.name }}
          </RouterLink>
        </h3>
        <span class="font-mono text-caption leading-4 text-muted">{{
          organization.shortName
        }}</span>
      </div>
      <span
        :aria-label="$t('orgs.rankBadge', { rank })"
        class="shrink-0 font-display font-bold text-muted"
        :class="medalClass(rank)"
      >
        #{{ rank }}
      </span>
    </div>
    <dl class="grid grid-cols-2 gap-2 tabular-nums">
      <div class="flex flex-col gap-0.5">
        <dt class="text-caption leading-4 text-muted">{{ $t('orgs.membersLabel') }}</dt>
        <dd class="font-bold">{{ memberCount }}</dd>
      </div>
      <div class="flex flex-col gap-0.5">
        <dt class="text-caption leading-4 text-muted">{{ $t('orgs.ppLabel') }}</dt>
        <dd class="font-bold text-positive">{{ performancePoints }}</dd>
      </div>
    </dl>
    <div
      class="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3"
    >
      <div class="flex flex-wrap items-center gap-2">
        <OrganizationJoinChip :is-open="organization.isOpen" />
        <Chip v-if="organization.isUnlisted" size="md">{{ $t('orgs.unlisted') }}</Chip>
      </div>
      <AppButton :to="actionRoute" :tone="actionTone" size="sm">{{ $t(actionKey) }}</AppButton>
    </div>
  </Card>
</template>
