import { computed } from 'vue';
import { translate } from '@/i18n';
import { usePermissions } from '@/stores/use-permissions';
import type { AdminFilterTab } from '../ui/AdminFilterTabs.vue';
import { ORGANIZATION_QUEUE_PERMISSION, useAllJoinRequestsQuery } from './join-requests.queries';

/** The organizations, join-request queue and quotas views: one tab row on the organizations page and the quotas page. */
export function useOrganizationViewTabs() {
  const { can } = usePermissions();
  const canSeeQueue = computed(() => can(ORGANIZATION_QUEUE_PERMISSION));
  const canSeeQuotas = computed(() => can('judge.edit_all_organization'));
  const pending = useAllJoinRequestsQuery('P', 1);
  const pendingTotal = computed(() => pending.data.value?.meta.total ?? 0);
  const requestsTab = (): AdminFilterTab => ({
    key: 'requests',
    label: translate('admin.organizations.views.requests'),
    to: { name: 'admin-organizations', query: { view: 'requests' } },
    testid: 'view-requests',
    count: pendingTotal.value,
    countLabel: translate('admin.organizations.views.pending', { count: pendingTotal.value }),
    countTestid: 'pending-count',
  });
  const quotasTab = (): AdminFilterTab => ({
    key: 'quotas',
    label: translate('admin.organizations.views.quotas'),
    to: { name: 'admin-organizationQuotas' },
    testid: 'view-quotas',
  });
  const tabs = computed<AdminFilterTab[]>(() => [
    {
      key: 'organizations',
      label: translate('admin.organizations.views.organizations'),
      to: { name: 'admin-organizations' },
      testid: 'view-organizations',
    },
    ...(canSeeQueue.value ? [requestsTab()] : []),
    ...(canSeeQuotas.value ? [quotasTab()] : []),
  ]);
  return { tabs, canSeeQueue };
}
