import { fetchText } from './admin-common.api';
import { API_BASE, apiRequest } from './client';
import type {
  DataFileKind,
  ProblemData,
  ProblemDataBody,
  SourceFileKind,
} from './types/problem-data';

const dataPath = (code: string) => `/problems/${encodeURIComponent(code)}/data`;

export const fetchProblemData = (code: string) => apiRequest<ProblemData>(dataPath(code));

export const putProblemData = (code: string, body: ProblemDataBody) =>
  apiRequest<ProblemData>(dataPath(code), { method: 'PUT', body });

/** An archive file as a plain link (the browser fetches it with the session cookie); never shown inline. */
export const problemDataFileUrl = (code: string, name: string) =>
  `${API_BASE}${dataPath(code)}/files/${encodeURIComponent(name)}`;

/** The generated init.yml as raw text, not a `{ data }` envelope. */
export const fetchInitYaml = (code: string) => fetchText(`${dataPath(code)}/init`);

const withFile = (file: File) => {
  const body = new FormData();
  body.append('file', file);
  return body;
};

export const uploadDataArchive = (code: string, file: File) =>
  apiRequest<ProblemData>(`${dataPath(code)}/archive`, { method: 'POST', body: withFile(file) });

export const uploadDataSource = (code: string, kind: SourceFileKind, file: File) =>
  apiRequest<ProblemData>(`${dataPath(code)}/files/${kind}`, {
    method: 'POST',
    body: withFile(file),
  });

export const deleteDataFile = (code: string, kind: DataFileKind) =>
  apiRequest<ProblemData>(`${dataPath(code)}/files/${kind}`, { method: 'DELETE' });
