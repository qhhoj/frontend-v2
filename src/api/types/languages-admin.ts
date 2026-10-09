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
