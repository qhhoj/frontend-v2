/** A user picked by exact username: the id the DTOs take, and the name when this session knows it. */
export interface UserChip {
  id: string;
  username: string | null;
}

/** An organization picked by exact slug: the id the DTOs take, and the slug when this session knows it. */
export interface OrganizationChip {
  id: string;
  slug: string | null;
}

export type PreviewStyle = 'problem' | 'problem-full' | 'solution' | 'blog' | 'user';

/** What a preview is rendered for: a problem style, or a static page (its own endpoint and permission). */
export type PreviewSource = PreviewStyle | 'flatpage';
