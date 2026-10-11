import type { Schemas } from '../schemas';
import type { CallOptions, JsonBodyOf } from '../typed';

export type ProblemData = Schemas['ProblemDataResponse'];
export type Checker = ProblemData['checker'];
export type Grader = ProblemData['grader'];
export type JsonObject = NonNullable<ProblemData['checkerArgs']>;
export type TestCase = Schemas['TestCaseResponse'];
/** A judge's compile check of an uploaded checker or interactor. */
export type SourceCheck = Schemas['SourceCheckResponse'];
/** A test's own checker: the custom bridged checker is problem-wide only. */
export type CaseChecker = TestCase['checker'];
/** `C` a single test, `S` opens a scored group, `E` closes it. */
export type CaseType = TestCase['type'];
/** The whole configuration and the test list. */
export type ProblemDataBody = JsonBodyOf<'/problems/{code}/data', 'put'>;

/** The four stored source files of a problem's data: each one is a single upload. */
export type SourceFileKind = CallOptions<
  '/problems/{code}/data/files/{kind}',
  'post'
>['path']['kind'];
/** Anything the data endpoints store: the archive or one of the source files. */
export type DataFileKind = CallOptions<
  '/problems/{code}/data/files/{kind}',
  'delete'
>['path']['kind'];
