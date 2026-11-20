import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useOrganizationNames } from '../../ui/use-organization-names';
import type { Restriction } from './participants-mode';
import type { ContestWorkbenchState } from './use-contest-workbench';

const KEY = 'admin.contests.workbench.participants.changes';

export interface AccessChangeLine {
  id: string;
  kind: 'removed' | 'added';
  text: string;
}

/**
 * One line per restriction the save would remove or add, named from the stored contest ("Bỏ giới hạn tổ chức 11 Tin",
 * "Bỏ danh sách 38 thí sinh", "Thêm mã vào"). The section and the confirm dialog show the same lines.
 */
export function useAccessChangeLines(workbench: ContestWorkbenchState) {
  const { t } = useI18n();
  const locale = useLocaleStore();
  const { seed } = workbench.settings;
  const { changes } = workbench.participants;
  const names = useOrganizationNames(() => changes.value.removed.includes('organization'));
  const count = (value: number) => formatNumber(value, locale.locale);

  function removedOrganizationText(): string {
    const stored = seed.value.organizations;
    const known = stored.flatMap((chip) => names.value.get(chip.id) ?? chip.slug ?? []);
    return known.length > 0 && known.length === stored.length
      ? t(`${KEY}.removed.organizationNamed`, { names: known.join(', ') })
      : t(`${KEY}.removed.organization`, { count: count(stored.length) });
  }
  const removedText: Record<Restriction, () => string> = {
    organization: removedOrganizationText,
    list: () => t(`${KEY}.removed.list`, { count: count(seed.value.privateContestants.length) }),
    code: () => t(`${KEY}.removed.code`),
  };

  return computed<AccessChangeLine[]>(() => [
    ...changes.value.removed.map((restriction) => ({
      id: `removed.${restriction}`,
      kind: 'removed' as const,
      text: removedText[restriction](),
    })),
    ...changes.value.added.map((restriction) => ({
      id: `added.${restriction}`,
      kind: 'added' as const,
      text: t(`${KEY}.added.${restriction}`),
    })),
  ]);
}
