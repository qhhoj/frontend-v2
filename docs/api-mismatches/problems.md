# Lane M2: problems, problem data, editing and imports

## M2-01

Resolved (backend ba5db96): the upload routes declare a multipart body; `fileBody()` only builds the `FormData`.

Routes: `POST /problems/uploads/image`, `POST /problems/{code}/statement`, `POST /problems/{code}/material`, `POST /problems/{code}/data/archive`, `POST /problems/{code}/data/files/{kind}`, `POST /problems/imports`.

The document says: `requestBody?: never` (no body at all).
The code needs: a `multipart/form-data` body with one binary `file` field (the handlers read it with the file interceptor).
Verdict: backend ask. `fileBody()` in `src/api/problem-data.api.ts` is the one `trustedUntilBackendFixed` site; the six calls spread it into their options.
Backend file to change: the upload handlers of `apps/api/src/modules/problems/` (uploads, data, imports controllers): add `@ApiConsumes('multipart/form-data')` and an `@ApiBody` schema `{ file: binary }` as `SubmissionCreateController.submitFile` does.

## M2-02

Resolved (backend ba5db96): `ProblemDetailResponse` lists the visibility enums; `visibilityOf` copies the fields.

Route: `GET /problems/{code}` (`ProblemDetailResponse`).

The document says: `submissionSourceVisibility`, `testcaseVisibility`, `testcaseResultVisibility` are `string`.
The code needs: the codes `'F' | 'A' | 'S' | 'O'`, `'O' | 'C' | 'A'`, `'A' | 'B' | 'S'` that `CreateProblemDto` and `UpdateProblemDto` list as enums, because the edit form assigns them to the same fields it sends back.
Verdict: backend ask. `visibilityOf` in `src/features/admin/problems/general/problem-form.ts` is the use site.
Backend file to change: `problems/core/dto/problem-detail.response.ts`: type the three members with the enums (`@ApiProperty({ enum })`).

## Notes, no ask

- `PutEditorialDto.authors` and the `PutProblemDataDto` / `TestCaseDto` members with `@default` are required in the generated body types (the document marks a member with a default as required). The frontend sends them all; nothing to fix.
- `ProblemEditingMeta` and `ProblemMeta` are now the same schema (`ProblemMetaResponse`, with `licenses`); `EditableProblem` and `ProblemDetail` are both `ProblemDetailResponse`. The fixtures were completed accordingly.
- `ImportJobResponse.state` is a `string` (the document lists the BullMQ states in prose only); the frontend does not branch on a closed set, so no ask.
