<script setup lang="ts">
import { computed } from 'vue';
import type { OrganizationListItem } from '@/api/types/organizations';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import OrganizationBadge from './OrganizationBadge.vue';
import OrganizationJoinChip from './OrganizationJoinChip.vue';

const props = defineProps<{ organization: OrganizationListItem }>();
const locale = useLocaleStore();
const memberCount = computed(() => formatNumber(props.organization.memberCount, locale.locale));
const performancePoints = computed(() =>
  formatNumber(props.organization.performancePoints, locale.locale),
);
</script>

<template>
  <article data-testid="organization-card" class="glass flex flex-col gap-3 rounded-card p-5">
    <div class="flex flex-wrap items-center gap-2">
      <OrganizationBadge :short-name="organization.shortName" />
      <OrganizationJoinChip :is-open="organization.isOpen" />
      <span
        v-if="organization.isUnlisted"
        class="rounded-pill border border-line px-3 py-1 text-sm text-muted"
      >
        {{ $t('orgs.unlisted') }}
      </span>
    </div>
    <h3 class="font-display text-lg font-semibold">
      <RouterLink
        :to="{ name: 'organization', params: { slug: organization.slug } }"
        class="hover:underline"
      >
        {{ organization.name }}
      </RouterLink>
    </h3>
    <p class="mt-auto flex flex-wrap gap-x-4 text-sm text-muted">
      <span>{{ $t('orgs.members', { count: memberCount }) }}</span>
      <span>{{ $t('orgs.pp', { pp: performancePoints }) }}</span>
    </p>
  </article>
</template>
