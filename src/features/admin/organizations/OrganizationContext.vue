<script setup lang="ts">
import { computed, ref } from 'vue';
import { recalculateOrganization } from '@/api/organizations-admin.api';
import type { OrganizationDetail } from '@/api/types/organizations';
import { formatDate, formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { usePermissions } from '@/stores/use-permissions';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { ADMIN_BUTTON_CLASS } from '../ui/classes';
import { seatsText } from './org-seats';
import { useOrganizationWrite } from './organization-write';

/** What an edit is about: the counts the form's limits act on, where the organization lives, and the staff repair. */
const props = defineProps<{ organization: OrganizationDetail }>();
const locale = useLocaleStore();
const { can } = usePermissions();
const canEditAll = computed(() => can('judge.edit_all_organization'));
const isQueued = ref(false);
const number = (value: number) => formatNumber(value, locale.locale);

const seats = computed(() => seatsText(props.organization, number));
const isFull = computed(
  () =>
    props.organization.slots !== null && props.organization.memberCount >= props.organization.slots,
);
const LINKS = [
  { route: 'organization', labelKey: 'admin.organizations.context.viewOnSite' },
  { route: 'organization-members', labelKey: 'admin.organizations.context.members' },
  { route: 'organization-problems', labelKey: 'admin.organizations.context.problems' },
  { route: 'organization-contests', labelKey: 'admin.organizations.context.contests' },
  { route: 'organization-posts', labelKey: 'admin.organizations.context.posts' },
  { route: 'organization-quota', labelKey: 'admin.organizations.context.quota' },
] as const;

const recalculation = useOrganizationWrite<string, void>({
  mutate: recalculateOrganization,
  onDone: () => void (isQueued.value = true),
});
</script>

<template>
  <section
    data-testid="org-context"
    :aria-label="$t('admin.organizations.context.label')"
    class="flex flex-col gap-3 rounded-tile border border-line bg-surface-strong p-4"
  >
    <dl class="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
      <div>
        <dt class="text-muted">{{ $t('admin.organizations.context.seats') }}</dt>
        <dd class="font-semibold tabular-nums" :class="{ 'text-negative': isFull }">{{ seats }}</dd>
      </div>
      <div>
        <dt class="text-muted">{{ $t('admin.organizations.context.admins') }}</dt>
        <dd class="font-semibold tabular-nums">{{ number(organization.admins.length) }}</dd>
      </div>
      <div>
        <dt class="text-muted">{{ $t('admin.organizations.context.points') }}</dt>
        <dd class="font-semibold tabular-nums">{{ number(organization.performancePoints) }}</dd>
      </div>
      <div>
        <dt class="text-muted">{{ $t('admin.organizations.context.created') }}</dt>
        <dd class="font-semibold">
          <time :datetime="organization.createdAt">{{
            formatDate(organization.createdAt, locale.locale)
          }}</time>
        </dd>
      </div>
    </dl>
    <p v-if="organization.isUnlisted" class="text-sm text-muted">
      {{ $t('admin.organizations.context.unlistedNote') }}
    </p>
    <nav
      :aria-label="$t('admin.organizations.context.linksLabel')"
      class="flex flex-wrap gap-x-4 gap-y-1"
    >
      <RouterLink
        v-for="link in LINKS"
        :key="link.route"
        :to="{ name: link.route, params: { slug: organization.slug } }"
        class="inline-flex min-h-11 items-center text-sm font-semibold text-accent-text hover:underline"
      >
        {{ $t(link.labelKey) }}
      </RouterLink>
    </nav>
    <div v-if="canEditAll" class="flex flex-wrap items-center gap-3">
      <button
        type="button"
        :class="ADMIN_BUTTON_CLASS"
        :aria-busy="recalculation.isPending.value || undefined"
        @click="recalculation.run(organization.slug)"
      >
        {{ $t('admin.organizations.context.recalculate') }}
      </button>
      <span class="text-xs text-muted">{{
        $t('admin.organizations.context.recalculateHint')
      }}</span>
    </div>
    <AdminStatus
      v-if="recalculation.failure.value"
      kind="refused"
      :text="failureTextOf(recalculation.failure.value)"
    />
    <AdminStatus
      v-else-if="isQueued"
      kind="done"
      :text="$t('admin.organizations.context.recalculateQueued')"
    />
  </section>
</template>
