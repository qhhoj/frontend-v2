import { fetchText } from './admin-common.api';
import { API_BASE, apiRequest } from './client';
import type { ProblemData, ProblemDataBody } from './types/problem-data';

const dataPath = (code: string) => `/problems/${encodeURIComponent(code)}/data`;

export const fetchProblemData = (code: string) => apiRequest<ProblemData>(dataPath(code));

export const putProblemData = (code: string, body: ProblemDataBody) =>
  apiRequest<ProblemData>(dataPath(code), { method: 'PUT', body });

/** An archive file as a plain link (the browser fetches it with the session cookie); never shown inline. */
export const problemDataFileUrl = (code: string, name: string) =>
  `${API_BASE}${dataPath(code)}/files/${encodeURIComponent(name)}`;

/** The generated init.yml as raw text, not a `{ data }` envelope. */
export const fetchInitYaml = (code: string) => fetchText(`${dataPath(code)}/init`);
