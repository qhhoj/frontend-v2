<script setup lang="ts">
import { computed } from 'vue';
import type { OrganizationDetail } from '@/api/types/organizations';
import AdminEditLink from '@/features/admin/edit-link/AdminEditLink.vue';
import { organizationEditTarget } from '@/features/admin/edit-link/admin-edit-targets';
import ShortLinkButton from '@/features/short-links/ShortLinkButton.vue';
import { shortLinkPath } from '@/features/short-links/short-link-path';
import { formatNumber, formatNumericDate } from '@/lib/format';
import { medalClass } from '@/lib/medal';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import MembershipPanel from './MembershipPanel.vue';
import OrganizationLogo from './OrganizationLogo.vue';
import { slotsLine } from './organization-facts';

/**
 * The compact title row of the header band: a small logo, the name with the edit pencil and the short-link icon, the facts on
 * one wrapping line, and the viewer's membership panel. `rank` is null while unknown.
 */
const props = defineProps<{ organization: OrganizationDetail; rank: number | null }>();
const locale = useLocaleStore();
const session = useSessionStore();
const editTarget = computed(() => organizationEditTarget(session.user, props.organization));
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
    class="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:gap-4"
  >
    <div class="flex min-w-0 flex-1 items-center gap-3">
      <OrganizationLogo :organization="organization" />
      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <div class="flex min-w-0 items-center gap-2">
          <h1 class="min-w-0 truncate font-display text-2xl font-bold leading-tight">
            {{ organization.name }}
          </h1>
          <AdminEditLink :to="editTarget" />
          <ShortLinkButton
            compact
            :path="shortLinkPath({ kind: 'organization', slug: organization.slug })"
          />
        </div>
        <p class="flex min-w-0 flex-wrap gap-x-3 gap-y-0.5 text-sm tabular-nums text-muted">
          <span class="font-mono">{{ organization.shortName }}</span>
          <span v-if="rank !== null">
            {{ $t('orgs.rankLabel') }} <b :class="medalClass(rank)">#{{ rank }}</b>
          </span>
          <span>{{ $t('orgs.membersMeta', { count: memberCount }) }}</span>
          <span class="text-positive">{{ $t('orgs.ppMeta', { pp: performancePoints }) }}</span>
          <span>{{ $t(joinPolicyKey) }}</span>
          <span>{{ $t('orgs.founded', { date: founded }) }}</span>
          <span>{{ $t(places.key, places.params ?? {}) }}</span>
        </p>
      </div>
    </div>
    <MembershipPanel :organization="organization" />
  </section>
</template>
