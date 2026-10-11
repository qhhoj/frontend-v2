/** `M<lane>-<nn>`: the number of a backend ask recorded in `docs/api-mismatches/<lane>.md`. */
export type AskId = `M${number}-${number}`;
const ASK_ID = /^M\d-\d{2}$/;
const ASK_CALL = /trustedUntilBackendFixed(?:<[^()]*>)?\(\s*'(M\d-\d{2})'/g;

/**
 * The one place a value is trusted past the generated types: the backend's document is wrong or silent about it.
 * Each use names its ask; `backend-ask.node.spec.ts` fails when the ask has no section in `docs/api-mismatches/`.
 * Delete the call when the ask lands.
 */
export function trustedUntilBackendFixed<Wanted>(askId: AskId, value: unknown): Wanted {
  if (!ASK_ID.test(askId)) throw new Error(`Backend ask id ${askId} must look like M<lane>-<nn>`);
  return value as Wanted;
}

/** The ask ids a source file passes to `trustedUntilBackendFixed`. */
export const askIdsIn = (sourceText: string): string[] =>
  [...sourceText.matchAll(ASK_CALL)].map((match) => match[1]!);
