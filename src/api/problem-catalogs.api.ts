import { apiGet, apiSend } from './typed';
import type {
  CreateLicenseBody,
  CreateTaxonBody,
  TaxonKind,
  UpdateLicenseBody,
  UpdateTaxonBody,
} from './types/problem-catalogs';

/** Backend problem catalogs admin: `judge.add_*` / `judge.change_*` on `problemtype`, `problemgroup`, `license`. */
export const fetchTaxa = (kind: TaxonKind) =>
  kind === 'problem-types' ? apiGet('/admin/problem-types') : apiGet('/admin/problem-groups');
export const createTaxon = (kind: TaxonKind, body: CreateTaxonBody) =>
  kind === 'problem-types'
    ? apiSend('post', '/admin/problem-types', { body })
    : apiSend('post', '/admin/problem-groups', { body });
export const updateTaxon = (kind: TaxonKind, id: string, body: UpdateTaxonBody) =>
  kind === 'problem-types'
    ? apiSend('patch', '/admin/problem-types/{id}', { path: { id }, body })
    : apiSend('patch', '/admin/problem-groups/{id}', { path: { id }, body });

export const fetchLicensesAdmin = () => apiGet('/admin/licenses');
export const createLicense = (body: CreateLicenseBody) =>
  apiSend('post', '/admin/licenses', { body });
export const updateLicense = (id: string, body: UpdateLicenseBody) =>
  apiSend('patch', '/admin/licenses/{id}', { path: { id }, body });
