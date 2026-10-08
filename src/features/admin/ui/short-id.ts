/** `0192c5a1-…-0e6d1f4a9c21` → `0192…9c21`: shown where the API gives an id but no name. */
export const shortId = (id: string): string =>
  id.length <= 9 ? id : `${id.slice(0, 4)}…${id.slice(-4)}`;
