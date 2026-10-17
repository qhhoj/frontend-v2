<script setup lang="ts">
import { computed } from 'vue';
import type { OrganizationDetail } from '@/api/types/organizations';
import AdminEditLink from '@/features/admin/edit-link/AdminEditLink.vue';
import { organizationEditTarget } from '@/features/admin/edit-link/admin-edit-targets';
import ShortLinkButton from '@/features/short-links/ShortLinkButton.vue';
import { shortLinkPath } from '@/features/short-links/short-link-path';
import { translate } from '@/i18n';
import { formatNumber, formatNumericDate } from '@/lib/format';
import { medalClass } from '@/lib/medal';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import MembershipChip from './MembershipChip.vue';
import MembershipPanel from './MembershipPanel.vue';
import OrganizationLogo from './OrganizationLogo.vue';
import OrganizationMenu from './OrganizationMenu.vue';
import { membershipState } from './membership-state';
import { joinModeKey, slotsLine } from './organization-facts';

/**
 * The compact title row of the header band (P-10): a small logo; the name with the viewer's standing as a chip, the edit pencil
 * and the short-link icon; the facts on two lines at most on a phone (standing, then how to join, shorter words there); and on the right either
 * the way in (`MembershipPanel`) or, for a member, the ⋯ menu that holds "Rời tổ chức". `rank` is null while unknown.
 */
const props = defineProps<{ organization: OrganizationDetail; rank: number | null }>();
const locale = useLocaleStore();
const session = useSessionStore();
const editTarget = computed(() => organizationEditTarget(session.user, props.organization));
const state = computed(() => membershipState(props.organization, session.user !== null));
const places = computed(() => slotsLine(props.organization));
const founded = computed(() => formatNumericDate(props.organization.createdAt, locale.locale));
const memberCount = computed(() => formatNumber(props.organization.memberCount, locale.locale));
const performancePoints = computed(() =>
  formatNumber(props.organization.performancePoints, locale.locale),
);
/** Standing, then how to join, in the short words. */
const phoneLines = computed(() => [
  [
    props.rank === null ? null : `${translate('orgs.rankLabel')} #${props.rank}`,
    translate('orgs.membersMeta', { count: memberCount.value }),
    translate('orgs.pp', { pp: performancePoints.value }),
  ]
    .filter(Boolean)
    .join(' · '),
  [
    translate(joinModeKey(props.organization.isOpen)),
    translate(places.value.key, places.value.params ?? {}),
  ].join(' · '),
]);
</script>

<template>
  <section
    data-testid="organization-header"
    class="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:gap-4"
  >
    <div class="flex min-w-0 flex-1 items-start gap-3">
      <OrganizationLogo :organization="organization" />
      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <h1
            class="min-w-0 font-display text-2xl leading-tight font-bold [overflow-wrap:anywhere]"
          >
            {{ organization.name }}
          </h1>
          <MembershipChip :state="state" />
          <AdminEditLink :to="editTarget" />
          <ShortLinkButton
            compact
            :path="shortLinkPath({ kind: 'organization', slug: organization.slug })"
          />
          <OrganizationMenu
            v-if="state === 'member'"
            :organization="organization"
            class="ml-auto shrink-0"
          />
        </div>
        <!-- Phone: two lines at most, each cut with an ellipsis; from md every fact on one wrapping line. -->
        <div data-testid="organization-facts" class="min-w-0 text-sm text-muted tabular-nums">
          <p class="truncate md:hidden">{{ phoneLines[0] }}</p>
          <p class="truncate md:hidden">{{ phoneLines[1] }}</p>
          <p class="flex flex-wrap gap-x-3 max-md:hidden">
            <span class="font-mono">{{ organization.shortName }}</span>
            <span v-if="rank !== null">
              {{ $t('orgs.rankLabel') }} <b :class="medalClass(rank)">#{{ rank }}</b>
            </span>
            <span>{{ $t('orgs.membersMeta', { count: memberCount }) }}</span>
            <span class="text-positive">{{ $t('orgs.ppMeta', { pp: performancePoints }) }}</span>
            <span>{{ $t(joinModeKey(organization.isOpen)) }}</span>
            <span>{{ $t(places.key, places.params ?? {}) }}</span>
            <span>{{ $t('orgs.founded', { date: founded }) }}</span>
          </p>
        </div>
      </div>
    </div>
    <MembershipPanel :organization="organization" :state="state" />
  </section>
</template>
