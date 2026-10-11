import { useQuery } from '@tanstack/vue-query';
import { fetchLicensesAdmin, fetchTaxa } from '@/api/problem-catalogs.api';
import type { TaxonKind } from '@/api/types/problem-catalogs';
import type { AdminQueryKey } from '../ui/use-admin-mutation';

export const taxaKey = (kind: TaxonKind) => ['admin', 'catalogs', kind] as const;
export const LICENSES_ADMIN_KEY = ['admin', 'catalogs', 'licenses'] as const;
/** A catalog write also changes `GET /problems/meta`: the editor's options and the public filters. */
export const META_KEYS: AdminQueryKey[] = [['admin', 'problem-meta'], ['problems']];

export const useTaxaQuery = (kind: TaxonKind) =>
  useQuery({ queryKey: taxaKey(kind), queryFn: () => fetchTaxa(kind) });

export const useLicensesAdminQuery = () =>
  useQuery({ queryKey: LICENSES_ADMIN_KEY, queryFn: fetchLicensesAdmin });
