<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue';
import { computed } from 'vue';
import type { OrganizationDetail } from '@/api/types/organizations';
import AdminEditLink from '@/features/admin/edit-link/AdminEditLink.vue';
import { organizationEditTarget } from '@/features/admin/edit-link/admin-edit-targets';
import ShortLinkButton from '@/features/short-links/ShortLinkButton.vue';
import { shortLinkPath } from '@/features/short-links/short-link-path';
import { formatNumber } from '@/lib/format';
import { medalClass } from '@/lib/medal';
import { PHONE_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import MembershipChip from './MembershipChip.vue';
import MembershipPanel from './MembershipPanel.vue';
import OrganizationLogo from './OrganizationLogo.vue';
import OrganizationMenu from './OrganizationMenu.vue';
import { membershipState } from './membership-state';
import { joinModeKey, slotsLine } from './organization-facts';

/**
 * The calm title row: a small logo; the name with the viewer's standing as a chip, the edit pencil and the short-link icon;
 * under it one line of facts (short name, members, how to join, places; rank and points from `md`); on the right the way in
 * (`MembershipPanel`) or, for a member, the ⋯ menu that holds "Rời tổ chức". `rank` is null while unknown.
 */
const props = defineProps<{ organization: OrganizationDetail; rank: number | null }>();
/** On a phone the actions drop under the title; the lone ⋯ would take a row of its own, so it joins the chips line instead. */
const isPhone = useMediaQuery(PHONE_QUERY);
const locale = useLocaleStore();
const session = useSessionStore();
const editTarget = computed(() => organizationEditTarget(session.user, props.organization));
const state = computed(() => membershipState(props.organization, session.user !== null));
/** Members leave through ⋯, administrators too (the chip shows them as administrators, not members). */
const isMember = computed(() => session.user !== null && !!props.organization.viewer?.isMember);
const places = computed(() => slotsLine(props.organization));
const hasPlacesCap = computed(() => props.organization.slots !== null);
const memberCount = computed(() => formatNumber(props.organization.memberCount, locale.locale));
const performancePoints = computed(() =>
  formatNumber(props.organization.performancePoints, locale.locale),
);
</script>
<template>
  <PageHeader data-testid="organization-header" :title="organization.name">
    <template #start><OrganizationLogo :organization="organization" size="sm" /></template>
    <template #meta>
      <MembershipChip :state="state" />
      <AdminEditLink :to="editTarget" />
      <ShortLinkButton
        compact
        :path="shortLinkPath({ kind: 'organization', slug: organization.slug })"
      />
      <OrganizationMenu v-if="isMember && isPhone" :organization="organization" />
    </template>
    <template #lead>
      <p data-testid="organization-facts" class="flex min-w-0 flex-wrap gap-x-3 tabular-nums">
        <span class="font-mono">{{ organization.shortName }}</span>
        <span>{{ $t('orgs.membersMeta', { count: memberCount }) }}</span>
        <span>{{ $t(joinModeKey(organization.isOpen)) }}</span>
        <span v-if="hasPlacesCap">{{ $t(places.key, places.params ?? {}) }}</span>
        <span v-if="rank !== null" class="max-md:hidden">
          {{ $t('orgs.rankLabel') }} <b :class="medalClass(rank)">#{{ rank }}</b>
        </span>
        <span class="text-positive max-md:hidden">{{
          $t('orgs.ppMeta', { pp: performancePoints })
        }}</span>
      </p>
    </template>
    <template #actions>
      <OrganizationMenu v-if="isMember && !isPhone" :organization="organization" />
      <MembershipPanel :organization="organization" :state="state" />
    </template>
  </PageHeader>
</template>
