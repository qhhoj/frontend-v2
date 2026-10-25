/** The part of a TanStack query a placeholder reads: only its key. */
interface QueryWithKey {
  queryKey: readonly unknown[];
}

/**
 * Placeholder that keeps the previous query's data only when that query was for `viewerId`.
 * `viewerIdIndex` is where the viewer id sits in the query key. Signed out is a viewer too: a visitor keeps a
 * visitor's page, but never one an account loaded.
 * Give the query a computed placeholder built from the viewer: TanStack reuses a placeholder it already
 * shows whenever the function is the same object, so a new viewer needs a new function.
 */
export const keepPreviousForSameViewer =
  (viewerIdIndex: number, viewerId: string) =>
  <T>(previous: T | undefined, previousQuery: QueryWithKey | undefined): T | undefined => {
    return previousQuery?.queryKey[viewerIdIndex] === viewerId ? previous : undefined;
  };
