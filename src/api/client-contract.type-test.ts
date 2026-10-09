import { expectTypeOf } from 'vitest';
import type { ApiErrorDetails, PageMeta } from './client';
import type { Schemas } from './schemas';

type ErrorBody = Schemas['ErrorBodyResponse'];

export function clientAcceptsDocumentedErrors(): void {
  expectTypeOf<ErrorBody['fields']>().toExtend<ApiErrorDetails['fields']>();
  expectTypeOf<ErrorBody['issues']>().toExtend<ApiErrorDetails['issues']>();
  expectTypeOf<ErrorBody>().toExtend<NonNullable<ApiErrorDetails['extra']>>();
}

export function clientReadsBothPageMetas(): void {
  expectTypeOf<Schemas['PageMetaResponse']>().toExtend<PageMeta>();
  expectTypeOf<Schemas['HasMorePageMetaResponse']>().toExtend<PageMeta>();
}
