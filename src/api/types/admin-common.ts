import type { JsonBodyOf } from '../typed';

/** @uiOnly a user picked by exact username: the id the DTOs take, and the name when this session knows it. */
export interface UserChip {
  id: string;
  username: string | null;
}

/** @uiOnly an organization picked by exact slug: the id the DTOs take, and the slug when this session knows it. */
export interface OrganizationChip {
  id: string;
  slug: string | null;
}

export type PreviewStyle = JsonBodyOf<'/problems/render-preview', 'post'>['style'];

/** @uiOnly what a preview is rendered for: a problem style, or a static page (its own endpoint and permission). */
export type PreviewSource = PreviewStyle | 'flatpage';
