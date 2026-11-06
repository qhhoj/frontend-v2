import { fetchText } from './admin-common.api';
import { apiGet, apiSend, apiUrl, fillPath } from './typed';
import type { DataOf } from './typed';
import type { DataFileKind, ProblemData, ProblemDataBody } from './types/problem-data';

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

/** The multipart body of a file upload: one `file` field; spread into the call options. */
export const fileBody = (file: File) => {
  const body = new FormData();
  body.append('file', file);
  return { body };
};

export const uploadDataArchive = (code: string, file: File): Promise<ProblemData> =>
  apiSend('post', '/problems/{code}/data/archive', { path: { code }, ...fileBody(file) });

export const deleteDataFile = (code: string, kind: DataFileKind): Promise<ProblemData> =>
  apiSend('delete', '/problems/{code}/data/files/{kind}', { path: { code, kind } });

/** A chunked archive upload: the server's chunk size, chunk count and the chunks it holds. */
export type DataUpload = DataOf<'/problems/{code}/data/uploads', 'post'>;
type DataUploadTarget = { code: string; id: string };

/** Takes no signal on purpose: a create the server ran must still answer its id, so a cancelled upload can delete it. */
export const createDataUpload = (
  code: string,
  file: { name: string; size: number; sha256: string },
): Promise<DataUpload> =>
  apiSend('post', '/problems/{code}/data/uploads', { path: { code }, body: file });

export const fetchDataUpload = (
  target: DataUploadTarget,
  signal?: AbortSignal,
): Promise<DataUpload> => apiGet('/problems/{code}/data/uploads/{id}', { path: target, signal });

export const putDataUploadChunk = (
  target: DataUploadTarget & { index: number },
  chunk: Blob,
  signal?: AbortSignal,
): Promise<DataUpload> => {
  const body = new FormData();
  body.append('file', chunk, 'chunk');
  return apiSend('put', '/problems/{code}/data/uploads/{id}/chunks/{index}', {
    path: target,
    body,
    signal,
  });
};

export const completeDataUpload = (
  target: DataUploadTarget,
  signal?: AbortSignal,
): Promise<ProblemData> =>
  apiSend('post', '/problems/{code}/data/uploads/{id}/complete', { path: target, signal });

export const cancelDataUpload = (target: DataUploadTarget): Promise<void> =>
  apiSend('delete', '/problems/{code}/data/uploads/{id}', { path: target });
