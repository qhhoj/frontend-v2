/** The catch-all param as the API path (`about/rules`). */
export const flatpagePath = (pathMatch: string | string[]) =>
  (Array.isArray(pathMatch) ? pathMatch : pathMatch.split('/')).filter(Boolean).join('/');
