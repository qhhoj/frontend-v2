import type { Schemas } from '../schemas';
import type { JsonBodyOf, QueryOf } from '../typed';

export type PolygonStatus = Schemas['PolygonStatusResponse'];
export type PolygonProblem = Schemas['PolygonProblemResponse'];
export type PolygonPackageState = Schemas['PolygonPackageState'];
export type PolygonProblemsQuery = QueryOf<'/polygon/problems'>;
export type PolygonImportBody = JsonBodyOf<'/polygon/problems/{polygonId}/import', 'post'>;
export type PolygonTestResult = Schemas['PolygonTestResponse'];
export type PolygonLink = Schemas['PolygonLinkResponse'];
export type PolygonLinkState = Schemas['PolygonLinkStateResponse'];
export type PolygonSyncRun = Schemas['PolygonSyncRunResponse'];
export type PolygonSyncStep = Schemas['PolygonSyncStep'];
