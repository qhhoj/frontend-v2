import { ApiError } from '@/api/client';
import { CODE_ENTRIES, POLYGON_OPTION_CODES, optionsFieldOf } from '../../ui/refusal-catalog';

const isOptionCode = (code: string) => (POLYGON_OPTION_CODES as readonly string[]).includes(code);

/**
 * A refusal of the import's options that the server finds before queueing (400, `params` as a job's `errorParams`):
 * the field of `PolygonLanguageFields` it belongs under (`main`, `tutorial`, `others`, `other:<language>`), or null for
 * the page line.
 */
export interface OptionsRefusal {
  field: string | null;
  text: string;
}

type Params = Record<string, unknown>;
const paramsOf = (error: ApiError): Params => {
  const params = error.extra.params;
  return params && typeof params === 'object' ? (params as Params) : {};
};

export { optionsFieldOf };

/** A refusal of the options as its code and params (the shape of a sync failure), or null for any other failure. */
export function optionsFailureOf(error: unknown): { code: string; params: Params } | null {
  if (!(error instanceof ApiError) || !isOptionCode(error.code)) return null;
  return { code: error.code, params: paramsOf(error) };
}

/** The refusal as the configure step shows it, or null when the failure is not about the options. */
export function optionsRefusalOf(error: unknown): OptionsRefusal | null {
  const failure = optionsFailureOf(error);
  if (!failure || !(error instanceof ApiError)) return null;
  return {
    field: optionsFieldOf(failure.code, failure.params),
    text: CODE_ENTRIES[failure.code]!.text(error),
  };
}
