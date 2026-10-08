/** backend: site/public/dto/flatpage.response.ts (FlatpageResponse) */
export interface Flatpage {
  /** Canonical: leading slash, no trailing slash. */
  url: string;
  title: string;
  contentHtml: string;
  registrationRequired: boolean;
}
