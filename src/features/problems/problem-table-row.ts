import type { ProblemListItem } from '@/api/types/problems';

/** What every list of problems gives `ProblemTable`: enough for the name cell and the row's link. */
export type ProblemTableRow = Pick<ProblemListItem, 'code' | 'name'>;

/**
 * A row as the catalogue's own cells read it (status lamp, type tag, points, rate, solvers). A managed list's rows lack
 * these fields, and `ProblemTable` never draws those cells for them (`managed`).
 */
export type CatalogueRow<Row extends ProblemTableRow> = Row & ProblemListItem;
