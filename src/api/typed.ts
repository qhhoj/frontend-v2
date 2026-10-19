import type { paths } from './generated/schema';
import { apiPage, apiRequest, buildUrl } from './client';
import type { Page, QueryValue } from './client';

type Prefix = '/api/internal';
/** A route of the backend, without the `/api/internal` prefix the client adds: `'/problems/{code}'`. */
export type ApiPath = keyof paths extends infer Spec
  ? Spec extends `${Prefix}${infer Rest}`
    ? Rest
    : never
  : never;
type SpecPath<Path extends ApiPath> = `${Prefix}${Path}` & keyof paths;

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';
/** The methods the backend documents for `Path`. */
export type MethodOf<Path extends ApiPath> = {
  [Method in HttpMethod]: [NonNullable<paths[SpecPath<Path>][Method]>] extends [never]
    ? never
    : Method;
}[HttpMethod];
type Operation<Path extends ApiPath, Method extends MethodOf<Path>> = NonNullable<
  paths[SpecPath<Path>][Method]
>;

type Defined<Value> = Exclude<Value, undefined>;
type Part<Op, Key extends 'path' | 'query'> = Op extends { parameters: infer Params }
  ? Key extends keyof Params
    ? Defined<Params[Key]>
    : never
  : never;
type Present<Value, Key extends string> = [Value] extends [never] ? unknown : { [K in Key]: Value };
type PresentOptional<Value, Key extends string> = [Value] extends [never]
  ? unknown
  : { [K in Key]?: Value };

type JsonBody<Op> = Op extends { requestBody: { content: { 'application/json': infer Body } } }
  ? Body
  : never;
type FormBody<Op> = Op extends { requestBody: { content: { 'multipart/form-data': unknown } } }
  ? FormData
  : never;
type BodyOf<Op> = JsonBody<Op> | FormBody<Op>;
type BodyOption<Op> = [BodyOf<Op>] extends [never]
  ? unknown
  : Op extends { requestBody?: never }
    ? unknown
    : { body: BodyOf<Op> };

/** What a call may pass: `path` and `query` as the document spells them, `body` when the route takes one. */
export type CallOptions<Path extends ApiPath, Method extends MethodOf<Path>> = Present<
  Part<Operation<Path, Method>, 'path'>,
  'path'
> &
  PresentOptional<Part<Operation<Path, Method>, 'query'>, 'query'> &
  BodyOption<Operation<Path, Method>> & { signal?: AbortSignal; cache?: RequestCache };

type SuccessBody<Op> = Op extends { responses: infer Responses }
  ? Responses[Extract<keyof Responses, 200 | 201 | 202>] extends infer Response
    ? Response extends { content: { 'application/json': infer Json } }
      ? Json
      : never
    : never
  : never;
/** The `data` of the route's success envelope; `void` for a 204. */
export type DataOf<Path extends ApiPath, Method extends MethodOf<Path>> = [
  SuccessBody<Operation<Path, Method>>,
] extends [never]
  ? void
  : SuccessBody<Operation<Path, Method>> extends { data: infer Data }
    ? Data
    : never;
/** The item type of a paginated route. */
export type ItemOf<Path extends ApiPath> =
  DataOf<Path, Extract<MethodOf<Path>, 'get'>> extends readonly (infer Item)[] ? Item : never;

type OptionsArg<Path extends ApiPath, Method extends MethodOf<Path>> =
  Record<never, never> extends CallOptions<Path, Method>
    ? [options?: CallOptions<Path, Method>]
    : [options: CallOptions<Path, Method>];
type GetPath = { [Path in ApiPath]: 'get' extends MethodOf<Path> ? Path : never }[ApiPath];
type WritePath = {
  [Path in ApiPath]: Exclude<MethodOf<Path>, 'get'> extends never ? never : Path;
}[ApiPath];
type GetOf<Path extends ApiPath> = Extract<MethodOf<Path>, 'get'>;
type WriteMethod<Path extends ApiPath> = Exclude<MethodOf<Path>, 'get'>;

type HasMeta<Body> = [Body] extends [never]
  ? false
  : [Body] extends [{ meta: unknown }]
    ? true
    : false;
/** The `meta` of a paginated route, as the backend documents it. */
export type MetaOf<Path extends PagedPath> =
  SuccessBody<Operation<Path, GetOf<Path>>> extends {
    meta: infer Meta;
  }
    ? Meta
    : never;
/** The GET routes whose success body carries `meta` (29 today): read them with `apiGetPage`. */
export type PagedPath = {
  [Path in ApiPath]: 'get' extends MethodOf<Path>
    ? HasMeta<SuccessBody<Operation<Path, GetOf<Path>>>> extends true
      ? Path
      : never
    : never;
}[ApiPath];
/** The GET routes without `meta`: read them with `apiGet`, which would otherwise silently drop a page's `meta`. */
export type PlainGetPath = Exclude<GetPath, PagedPath>;

interface LooseOptions {
  path?: Record<string, string | number>;
  query?: Record<string, QueryValue>;
  body?: unknown;
  signal?: AbortSignal;
  cache?: RequestCache;
}

/** `/problems/{code}` + `{ code: 'a/b' }` -> `/problems/a%2Fb`. */
export function fillPath(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_match, name: string) => {
    const value = params[name];
    if (value === undefined) throw new Error(`Missing path parameter ${name}`);
    return encodeURIComponent(String(value));
  });
}

function requestOf(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  options: LooseOptions = {},
) {
  const { query, body, signal, cache } = options;
  return { method, query, body, signal, cache };
}

/** A GET whose URL, query and `data` come from the backend's OpenAPI document; paginated routes are refused (use `apiGetPage`). */
export const apiGet = <Path extends PlainGetPath>(
  path: Path,
  ...[options]: OptionsArg<Path, GetOf<Path>>
): Promise<DataOf<Path, GetOf<Path>>> => {
  const loose = options as LooseOptions | undefined;
  return apiRequest(fillPath(path, loose?.path), requestOf('GET', loose));
};

/** A paginated GET: `data` is the item list, `meta` the page. Only routes whose success body has `meta`. */
export const apiGetPage = <Path extends PagedPath>(
  path: Path,
  ...[options]: OptionsArg<Path, GetOf<Path>>
): Promise<Page<ItemOf<Path>, MetaOf<Path>>> => {
  const loose = options as LooseOptions | undefined;
  return apiPage<ItemOf<Path>, MetaOf<Path>>(fillPath(path, loose?.path), requestOf('GET', loose));
};

/** POST, PUT, PATCH or DELETE with a typed body and `data`. */
export const apiSend = <Path extends WritePath, Method extends WriteMethod<Path>>(
  method: Method,
  path: Path,
  ...[options]: OptionsArg<Path, Method>
): Promise<DataOf<Path, Method>> => {
  const loose = options as LooseOptions | undefined;
  return apiRequest(
    fillPath(path, loose?.path),
    requestOf(method.toUpperCase() as 'POST' | 'PUT' | 'PATCH' | 'DELETE', loose),
  );
};

/** The query of a route as the document spells it (`QueryOf<'/problems'>`); `never` when it has none. */
export type QueryOf<Path extends ApiPath, Method extends MethodOf<Path> = GetOf<Path>> = Part<
  Operation<Path, Method>,
  'query'
>;
/** The JSON body of a route (`JsonBodyOf<'/auth/login', 'post'>`). */
export type JsonBodyOf<Path extends ApiPath, Method extends MethodOf<Path>> = JsonBody<
  Operation<Path, Method>
>;
/** The members of a body a caller must always supply: building it as this type fails typecheck when the backend adds one. */
export type RequiredPart<Body> = Pick<
  Body,
  { [Key in keyof Body]-?: object extends Pick<Body, Key> ? never : Key }[keyof Body]
>;
type StreamFrame<Path extends ApiPath> =
  Operation<Path, GetOf<Path>> extends {
    responses: { 200: { content: { 'text/event-stream': infer Frame } } };
  }
    ? Frame
    : never;
/** The event names a stream route sends (`'queued' | 'done' | ...`). */
export type StreamEventName<Path extends ApiPath> =
  StreamFrame<Path> extends infer Frame
    ? Frame extends { event: infer Name }
      ? Name
      : never
    : never;
/** The routes that answer with an event stream (`'/events/user'`, `'/events/tickets/{id}'`, ...). */
export type StreamPath = {
  [Path in ApiPath]: [StreamEventName<Path>] extends [never] ? never : Path;
}[ApiPath];
/** The JSON payload of the frames named `Name` on a stream route. */
export type StreamData<Path extends ApiPath, Name extends StreamEventName<Path>> =
  StreamFrame<Path> extends infer Frame
    ? Frame extends { event: infer Names; data: infer Data }
      ? Name extends Names
        ? Data
        : never
      : never
    : never;

/** The address of a route for a link, an `EventSource` or a download (no request is made). */
export const apiUrl = <Path extends GetPath>(
  path: Path,
  ...[options]: OptionsArg<Path, GetOf<Path>>
): string => {
  const loose = options as LooseOptions | undefined;
  return buildUrl(fillPath(path, loose?.path), loose?.query);
};
