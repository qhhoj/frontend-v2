import { expectTypeOf } from 'vitest';
import type { ApiErrorDetails, TotalPageMeta } from './client';
import type { MetaOf } from './typed';
import type { Schemas } from './schemas';

type ErrorBody = Schemas['ErrorBodyResponse'];

export function clientAcceptsDocumentedErrors(): void {
  expectTypeOf<ErrorBody['fields']>().toExtend<ApiErrorDetails['fields']>();
  expectTypeOf<ErrorBody['issues']>().toExtend<ApiErrorDetails['issues']>();
  expectTypeOf<ErrorBody>().toExtend<NonNullable<ApiErrorDetails['extra']>>();
}

export function pagedRoutesCarryTheirDocumentedMeta(): void {
  expectTypeOf<MetaOf<'/users/{username}/comments'>>().toEqualTypeOf<
    Schemas['CursorPageMetaResponse']
  >();
  expectTypeOf<MetaOf<'/users/{username}/pp-breakdown'>>().toEqualTypeOf<
    Schemas['HasMorePageMetaResponse']
  >();
  expectTypeOf<MetaOf<'/problems'>>().toEqualTypeOf<TotalPageMeta>();
}
