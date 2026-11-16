import { problemTypeLabel } from './problem-type-label';
import type { CatalogItem } from '@/api/types/problems';
import { translate } from '@/i18n';
import type { ProblemFilters } from './use-problem-filters';

export interface FilterChip {
  key: string;
  label: string;
  /** The patch that removes just this filter. */
  clear: Partial<ProblemFilters>;
}
type Catalog = { types: CatalogItem[]; groups: CatalogItem[] };

const searchChips = (filters: ProblemFilters): FilterChip[] =>
  filters.search ? [{ key: 'search', label: `“${filters.search}”`, clear: { search: '' } }] : [];

function groupChips(filters: ProblemFilters, catalog: Catalog): FilterChip[] {
  const group = catalog.groups.find((item) => item.id === filters.groupId);
  return group ? [{ key: 'group', label: group.fullName, clear: { groupId: null } }] : [];
}

/** One chip per picked type that the catalog knows, in picking order. */
const typeChips = (filters: ProblemFilters, catalog: Catalog): FilterChip[] =>
  filters.typeIds.flatMap((id) => {
    const type = catalog.types.find((item) => item.id === id);
    return type
      ? [
          {
            key: `type:${id}`,
            label: problemTypeLabel(type),
            clear: { typeIds: filters.typeIds.filter((picked) => picked !== id) },
          },
        ]
      : [];
  });

const pointsChips = ({ pointsMin, pointsMax }: ProblemFilters): FilterChip[] =>
  pointsMin === null && pointsMax === null
    ? []
    : [
        {
          key: 'points',
          label: translate('problems.pointsChip', {
            min: pointsMin ?? '…',
            max: pointsMax ?? '…',
          }),
          clear: { pointsMin: null, pointsMax: null },
        },
      ];

const flagChips = (filters: ProblemFilters): FilterChip[] => [
  ...(filters.hideSolved
    ? [{ key: 'hideSolved', label: translate('problems.hideSolved'), clear: { hideSolved: false } }]
    : []),
  ...(filters.hasEditorial
    ? [
        {
          key: 'hasEditorial',
          label: translate('problems.hasEditorial'),
          clear: { hasEditorial: false },
        },
      ]
    : []),
];

/** One chip per active filter (a chip per picked type), in toolbar order. */
export const filterChips = (filters: ProblemFilters, catalog: Catalog): FilterChip[] => [
  ...searchChips(filters),
  ...groupChips(filters, catalog),
  ...typeChips(filters, catalog),
  ...pointsChips(filters),
  ...flagChips(filters),
];
