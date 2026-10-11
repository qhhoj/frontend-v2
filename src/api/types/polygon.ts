import type { Schemas } from '../schemas';
import type { JsonBodyOf } from '../typed';

export type PolygonStatus = Schemas['PolygonStatusResponse'];
export type PolygonProblem = Schemas['PolygonProblemResponse'];
export type PolygonPackageState = Schemas['PolygonPackageState'];
export type PolygonImportBody = JsonBodyOf<'/polygon/import', 'post'>;
export type PolygonTestResult = Schemas['PolygonTestResponse'];
export type PolygonLink = Schemas['PolygonLinkResponse'];
export type PolygonLinkState = Schemas['PolygonLinkStateResponse'];
export type PolygonSyncRun = Schemas['PolygonSyncRunResponse'];
export type PolygonSyncStep = Schemas['PolygonSyncStep'];
