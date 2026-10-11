import { computed } from 'vue';
import { translate } from '@/i18n';
import { usePermissions } from '@/stores/use-permissions';
import type { AdminTab } from '../ui/AdminTabs.vue';
import { ORGANIZATION_QUEUE_PERMISSION, useAllJoinRequestsQuery } from './join-requests.queries';

/**
 * The page tabs shared by the organizations page and the quotas page: Tổ chức · Yêu cầu (pending count) · Hạn mức.
 * A tab the viewer may not open is left out.
 */
export function useOrganizationViewTabs() {
  const { can } = usePermissions();
  const canSeeQueue = computed(() => can(ORGANIZATION_QUEUE_PERMISSION));
  const canSeeQuotas = computed(() => can('judge.edit_all_organization'));
  const pending = useAllJoinRequestsQuery('P', 1);
  const pendingTotal = computed(() => pending.data.value?.meta.total ?? 0);
  const requestsTab = (): AdminTab => ({
    key: 'requests',
    labelKey: 'admin.organizations.views.requests',
    to: { name: 'admin-organizations', query: { view: 'requests' } },
    testid: 'view-requests',
    count: pendingTotal.value > 0 ? pendingTotal.value : null,
    countLabel: translate('admin.organizations.views.pending', { count: pendingTotal.value }),
    countTestid: 'pending-count',
  });
  const quotasTab = (): AdminTab => ({
    key: 'quotas',
    labelKey: 'admin.organizations.views.quotas',
    to: { name: 'admin-organizationQuotas' },
    testid: 'view-quotas',
  });
  const tabs = computed<AdminTab[]>(() => [
    {
      key: 'organizations',
      labelKey: 'admin.organizations.views.organizations',
      to: { name: 'admin-organizations' },
      testid: 'view-organizations',
    },
    ...(canSeeQueue.value ? [requestsTab()] : []),
    ...(canSeeQuotas.value ? [quotasTab()] : []),
  ]);
  return { tabs, canSeeQueue };
}
