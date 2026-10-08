export interface Reply {
  status?: number;
  body?: unknown;
  /** Extra response headers (`Retry-After`, `Cache-Control`). */
  headers?: Record<string, string>;
  /** Defaults to application/json; `application/pdf` and `text/event-stream` for the PDF and the feeds. */
  contentType?: string;
  /** Sent as is instead of `JSON.stringify(body)`. */
  raw?: string | Buffer;
}
export interface HandlerInput {
  url: URL;
  body: unknown;
  postData: Buffer | null;
  headers: Record<string, string>;
  params: Record<string, string>;
}
export type Handler = Reply | ((request: HandlerInput) => Reply);

export const ok = (data: unknown): Reply => ({ body: { data } });
export const list = (items: unknown[]): Reply => ({
  body: { data: items, meta: { page: 1, pageSize: 50, total: items.length } },
});
