/** A programming language as staff see it (`GET /admin/languages`, backend `LanguageAdminResponse`). */
export interface LanguageAdmin {
  id: string;
  /** The judge runtime key (`CPP20`); a judge reports its runtimes under this key. Fixed once created. */
  key: string;
  name: string;
  shortName: string | null;
  commonName: string;
  ace: string;
  pygments: string;
  template: string;
  info: string;
  description: string;
  extension: string;
  fileOnly: boolean;
  fileSizeLimit: number;
  includeInProblem: boolean;
}

/** `POST /admin/languages` body (`judge.add_language`). Optional text fields are sent only when filled in. */
export interface CreateLanguageBody {
  key: string;
  name: string;
  shortName?: string;
  commonName: string;
  ace: string;
  pygments: string;
  template?: string;
  info?: string;
  description?: string;
  extension: string;
  fileOnly?: boolean;
  fileSizeLimit?: number;
  includeInProblem?: boolean;
}

/** `PATCH /admin/languages/:id` body: no `key` (fixed), and `shortName: null` clears it. */
export type UpdateLanguageBody = Partial<Omit<CreateLanguageBody, 'key' | 'shortName'>> & {
  shortName?: string | null;
};
