import { fetchText } from './admin-common.api';
import { apiGet, apiSend, apiUrl, fillPath } from './typed';
import { trustedUntilBackendFixed } from './backend-ask';
import type {
  DataFileKind,
  ProblemData,
  ProblemDataBody,
  SourceFileKind,
} from './types/problem-data';

export const fetchProblemData = (code: string): Promise<ProblemData> =>
  apiGet('/problems/{code}/data', { path: { code } });

export const putProblemData = (code: string, body: ProblemDataBody): Promise<ProblemData> =>
  apiSend('put', '/problems/{code}/data', { path: { code }, body });

/** An archive file as a plain link (the browser fetches it with the session cookie); never shown inline. */
export const problemDataFileUrl = (code: string, name: string) =>
  apiUrl('/problems/{code}/data/files/{name}', { path: { code, name } });

/** The generated init.yml as raw text, not a `{ data }` envelope. */
export const fetchInitYaml = (code: string) =>
  fetchText(fillPath('/problems/{code}/data/init', { code }));

/**
 * M2-01: the document lists no multipart body for the file uploads of the problem routes, so the type refuses `body`;
 * spreading this result into the call options is the one place that passes it.
 */
export const fileBody = (file: File) => {
  const body = new FormData();
  body.append('file', file);
  return trustedUntilBackendFixed<object>('M2-01', { body });
};

export const uploadDataArchive = (code: string, file: File): Promise<ProblemData> =>
  apiSend('post', '/problems/{code}/data/archive', { path: { code }, ...fileBody(file) });

export const uploadDataSource = (
  code: string,
  kind: SourceFileKind,
  file: File,
): Promise<ProblemData> =>
  apiSend('post', '/problems/{code}/data/files/{kind}', {
    path: { code, kind },
    ...fileBody(file),
  });

export const deleteDataFile = (code: string, kind: DataFileKind): Promise<ProblemData> =>
  apiSend('delete', '/problems/{code}/data/files/{kind}', { path: { code, kind } });
