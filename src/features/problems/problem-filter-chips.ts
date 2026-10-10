import type { CatalogItem } from '@/api/types/problems';
import { translate } from '@/i18n';
import type { ProblemFilters } from './use-problem-filters';

export interface FilterChip {
  key: string;
  label: string;
  /** The patch that removes just this filter. */
  clear: Partial<ProblemFilters>;
}

/** One chip per active filter (a chip per picked type), in toolbar order. */
export function filterChips(
  filters: ProblemFilters,
  catalog: { types: CatalogItem[]; groups: CatalogItem[] },
): FilterChip[] {
  const chips: FilterChip[] = [];
  if (filters.search)
    chips.push({ key: 'search', label: `“${filters.search}”`, clear: { search: '' } });
  const group = catalog.groups.find((item) => item.id === filters.groupId);
  if (group) chips.push({ key: 'group', label: group.fullName, clear: { groupId: null } });
  for (const id of filters.typeIds) {
    const type = catalog.types.find((item) => item.id === id);
    if (type)
      chips.push({
        key: `type:${id}`,
        label: type.fullName,
        clear: { typeIds: filters.typeIds.filter((picked) => picked !== id) },
      });
  }
  if (filters.pointsMin !== null || filters.pointsMax !== null)
    chips.push({
      key: 'points',
      label: translate('problems.pointsChip', {
        min: filters.pointsMin ?? '…',
        max: filters.pointsMax ?? '…',
      }),
      clear: { pointsMin: null, pointsMax: null },
    });
  if (filters.hideSolved)
    chips.push({
      key: 'hideSolved',
      label: translate('problems.hideSolved'),
      clear: { hideSolved: false },
    });
  if (filters.hasEditorial)
    chips.push({
      key: 'hasEditorial',
      label: translate('problems.hasEditorial'),
      clear: { hasEditorial: false },
    });
  return chips;
}
