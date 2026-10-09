import { apiText } from './client';
import { fetchOrganization } from './organizations.api';
import type { OrganizationChip, PreviewSource, UserChip } from './types/admin-common';
import { apiSend } from './typed';
import { fetchUserPage } from './users.api';

/** An exact username as the id the DTOs take (`GET /users/:username`); only the id and the name are kept. */
export async function lookupUser(username: string): Promise<UserChip> {
  const page = await fetchUserPage(username);
  return { id: page.id, username: page.username };
}

/** An exact slug as the id the DTOs take (`GET /organizations/:slug`). */
export async function lookupOrganization(slug: string): Promise<OrganizationChip> {
  const organization = await fetchOrganization(slug);
  return { id: organization.id, slug: organization.slug };
}

/**
 * backend P3: `POST /problems/render-preview` `{ style, markdown }` (`judge.edit_own_problem`), or for `'flatpage'`
 * `POST /admin/site/pages/render-preview` `{ content }` (`flatpages.change_flatpage`). Both answer the sanitised `{ html }`.
 */
export async function renderPreview(source: PreviewSource, markdown: string): Promise<string> {
  const { html } =
    source === 'flatpage'
      ? await apiSend('post', '/admin/site/pages/render-preview', { body: { content: markdown } })
      : await apiSend('post', '/problems/render-preview', { body: { style: source, markdown } });
  return html;
}

/** Raw text endpoints (`init.yml`): not a `{ data }` envelope, same session handling. */
export const fetchText = (path: string): Promise<string> => apiText(path);
