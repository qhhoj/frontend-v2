<script setup lang="ts">
import { ExternalLink, RefreshCw } from 'lucide-vue-next';
import { computed } from 'vue';
import { recalculateOrganization } from '@/api/organizations-admin.api';
import type { OrganizationDetail } from '@/api/types/organizations';
import { formatNumber } from '@/lib/format';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import { usePermissions } from '@/stores/use-permissions';
import { translate } from '@/i18n';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { buttonClass } from '../ui/controls';
import { useAdminToast } from '../ui/feedback/use-admin-toast';
import { seatsText } from './org-seats';
import { useOrganizationWrite } from './organization-write';

/** What an edit is about: the counts the form's limits act on, where the organization lives, and the staff repair. */
const props = defineProps<{ organization: OrganizationDetail }>();
const locale = useLocaleStore();
const { can } = usePermissions();
const canEditAll = computed(() => can('judge.edit_all_organization'));
const toast = useAdminToast();
const number = (value: number) => formatNumber(value, locale.locale);

const seats = computed(() => seatsText(props.organization, number));
const isFull = computed(
  () =>
    props.organization.slots !== null && props.organization.memberCount >= props.organization.slots,
);
const stats = computed(() => [
  { key: 'seats', text: seats.value, isAlert: isFull.value },
  { key: 'admins', text: number(props.organization.admins.length) },
  { key: 'points', text: number(props.organization.performancePoints) },
  {
    key: 'created',
    text: formatDate(props.organization.createdAt, 'date', locale.locale),
    datetime: props.organization.createdAt,
  },
]);
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
  onDone: () => toast.show({ text: translate('admin.organizations.context.recalculateQueued') }),
});
</script>

<template>
  <section
    data-testid="org-context"
    :aria-label="$t('admin.organizations.context.label')"
    class="flex flex-col gap-3"
  >
    <dl class="m-0 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div
        v-for="stat in stats"
        :key="stat.key"
        class="rounded-cell border border-line bg-surface-solid px-3 py-2"
      >
        <dt class="text-xs text-muted">{{ $t(`admin.organizations.context.${stat.key}`) }}</dt>
        <dd
          class="m-0 text-base font-semibold whitespace-nowrap tabular-nums"
          :class="[stat.isAlert && 'text-negative', !stat.datetime && 'font-mono']"
        >
          <time v-if="stat.datetime" :datetime="stat.datetime">{{ stat.text }}</time>
          <template v-else>{{ stat.text }}</template>
        </dd>
      </div>
    </dl>
    <p v-if="organization.isUnlisted" class="m-0 text-sm text-muted">
      {{ $t('admin.organizations.context.unlistedNote') }}
    </p>
    <div class="flex flex-wrap items-center gap-x-1 gap-y-1">
      <nav :aria-label="$t('admin.organizations.context.linksLabel')" class="contents">
        <RouterLink
          v-for="link in LINKS"
          :key="link.route"
          :to="{ name: link.route, params: { slug: organization.slug } }"
          :class="buttonClass('ghost', 'sm')"
        >
          <ExternalLink
            v-if="link.route === 'organization'"
            aria-hidden="true"
            class="size-4"
            :stroke-width="1.75"
          />
          {{ $t(link.labelKey) }}
        </RouterLink>
      </nav>
      <button
        v-if="canEditAll"
        type="button"
        :class="[buttonClass('secondary', 'sm'), 'ml-auto']"
        :title="$t('admin.organizations.context.recalculateHint')"
        :aria-busy="recalculation.isPending.value || undefined"
        @click="recalculation.run(organization.slug)"
      >
        <RefreshCw aria-hidden="true" class="size-4" :stroke-width="1.75" />
        {{ $t('common.rescore') }}
      </button>
    </div>
    <AdminStatus
      v-if="recalculation.failure.value"
      kind="refused"
      :text="failureTextOf(recalculation.failure.value)"
    />
  </section>
</template>
