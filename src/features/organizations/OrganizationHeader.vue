<script setup lang="ts">
import { computed } from 'vue';
import type { OrganizationDetail } from '@/api/types/organizations';
import StateBit from '@/components/StateBit.vue';
import ShortLinkButton from '@/features/short-links/ShortLinkButton.vue';
import { shortLinkPath } from '@/features/short-links/short-link-path';
import { formatNumber, formatNumericDate } from '@/lib/format';
import { medalClass } from '@/lib/medal';
import { useLocaleStore } from '@/stores/locale.store';
import MembershipPanel from './MembershipPanel.vue';
import OrganizationLogo from './OrganizationLogo.vue';
import { slotsLine } from './organization-facts';

/** The title row of the header band: logo, name, facts and the viewer's membership panel. `rank` is null while unknown. */
const props = defineProps<{ organization: OrganizationDetail; rank: number | null }>();
const locale = useLocaleStore();
const places = computed(() => slotsLine(props.organization));
const founded = computed(() => formatNumericDate(props.organization.createdAt, locale.locale));
const memberCount = computed(() => formatNumber(props.organization.memberCount, locale.locale));
const performancePoints = computed(() =>
  formatNumber(props.organization.performancePoints, locale.locale),
);
const joinPolicyKey = computed(() =>
  props.organization.isOpen ? 'orgs.joinPolicyOpen' : 'orgs.joinPolicyApproval',
);
</script>

<template>
  <section
    data-testid="organization-header"
    class="flex flex-col gap-5 md:flex-row md:items-center"
  >
    <OrganizationLogo :organization="organization" size="lg" />
    <div class="flex min-w-0 flex-1 flex-col gap-1.5">
      <div class="flex items-center gap-3">
        <h1 class="min-w-0 font-display text-3xl font-bold leading-tight">
          {{ organization.name }}
        </h1>
        <StateBit variant="community" size="inline" class="shrink-0" />
      </div>
      <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm tabular-nums text-muted">
        <span class="font-mono">{{ organization.shortName }}</span>
        <span v-if="rank !== null">
          {{ $t('orgs.rankLabel') }} <b :class="medalClass(rank)">#{{ rank }}</b>
        </span>
        <span>{{ $t('orgs.membersMeta', { count: memberCount }) }}</span>
        <span class="text-positive">{{ $t('orgs.ppMeta', { pp: performancePoints }) }}</span>
        <span>{{ $t(joinPolicyKey) }}</span>
      </div>
      <p class="text-sm text-muted">
        {{ $t('orgs.founded', { date: founded }) }} · {{ $t(places.key, places.params ?? {}) }}
      </p>
      <ShortLinkButton
        class="sm:self-start"
        :path="shortLinkPath({ kind: 'organization', slug: organization.slug })"
      />
    </div>
    <MembershipPanel :organization="organization" />
  </section>
</template>
