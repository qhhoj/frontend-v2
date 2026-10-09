<script setup lang="ts">
import { computed } from 'vue';
import type { OrganizationDetail } from '@/api/types/organizations';
import ShortLinkButton from '@/features/short-links/ShortLinkButton.vue';
import { shortLinkPath } from '@/features/short-links/short-link-path';
import { formatNumber, formatNumericDate } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import MembershipPanel from './MembershipPanel.vue';
import OrganizationBadge from './OrganizationBadge.vue';
import OrganizationJoinChip from './OrganizationJoinChip.vue';
import { slotsLine } from './organization-facts';

const props = defineProps<{ organization: OrganizationDetail }>();
const locale = useLocaleStore();
const places = computed(() => slotsLine(props.organization));
const founded = computed(() => formatNumericDate(props.organization.createdAt, locale.locale));
const memberCount = computed(() => formatNumber(props.organization.memberCount, locale.locale));
const performancePoints = computed(() =>
  formatNumber(props.organization.performancePoints, locale.locale),
);
</script>

<template>
  <section
    data-testid="organization-header"
    class="glass flex flex-col gap-5 rounded-card p-5 sm:p-7 md:flex-row md:items-start md:justify-between"
  >
    <div class="flex min-w-0 flex-1 flex-col gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <OrganizationBadge :short-name="organization.shortName" />
        <OrganizationJoinChip :is-open="organization.isOpen" />
        <span class="text-sm text-muted">{{ $t('orgs.founded', { date: founded }) }}</span>
      </div>
      <h1 class="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {{ organization.name }}
      </h1>
      <p class="text-muted">
        {{ $t('orgs.members', { count: memberCount }) }} ·
        {{ $t('orgs.ppLong', { pp: performancePoints }) }}
      </p>
      <p class="text-sm font-semibold">{{ $t(places.key, places.params ?? {}) }}</p>
      <ShortLinkButton
        class="sm:self-start"
        :path="shortLinkPath({ kind: 'organization', slug: organization.slug })"
      />
    </div>
    <MembershipPanel :organization="organization" />
  </section>
</template>
