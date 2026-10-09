/** backend: problems/data/dto/problem-data.response.ts (`Checker`). */
export type Checker =
  'standard' | 'bridged' | 'floats' | 'floatsabs' | 'floatsrel' | 'identical' | 'linecount';
/** A test's own checker: the custom bridged checker is problem-wide only. */
export type CaseChecker = '' | Exclude<Checker, 'bridged'>;
/** backend: problems/data/dto/problem-data.dto.ts (`Grader`). */
export type Grader = 'standard' | 'interactive' | 'signature' | 'output_only';
/** `C` a single test, `S` opens a scored group, `E` closes it. */
export type CaseType = 'C' | 'S' | 'E';
export type JsonObject = Record<string, unknown>;

/** backend: problems/data/dto/problem-data.response.ts (`TestCaseResponse`). */
export interface TestCase {
  type: CaseType;
  input: string;
  output: string;
  points: number | null;
  isPretest: boolean;
  generatorArgs: string;
  checker: CaseChecker;
  checkerArgs: JsonObject | null;
  outputPrefix: number | null;
  outputLimit: number | null;
}

/** backend: problems/data/dto/problem-data.response.ts (`ProblemDataResponse`), read by editors. */
export interface ProblemData {
  archive: string | null;
  generator: string | null;
  customChecker: string | null;
  customGrader: string | null;
  customHeader: string | null;
  checker: Checker;
  checkerArgs: JsonObject | null;
  grader: Grader;
  graderArgs: JsonObject | null;
  outputPrefix: number | null;
  outputLimit: number | null;
  unicode: boolean;
  nobigmath: boolean;
  /** The last init.yml failure, one message per line; '' when none. */
  feedback: string;
  cases: TestCase[];
  archiveFiles: string[];
  hasInit: boolean;
  limits: { softCases: number; maxCases: number };
}

/** backend: problems/data/dto/problem-data.dto.ts (`PutProblemDataDto`): the whole configuration and the test list. */
export interface ProblemDataBody {
  checker: Checker;
  checkerArgs: JsonObject | null;
  grader: Grader;
  graderArgs: JsonObject | null;
  outputPrefix: number | null;
  outputLimit: number | null;
  unicode: boolean;
  nobigmath: boolean;
  cases: TestCase[];
}
