import { inject } from 'vue';
import type { ComputedRef, InjectionKey } from 'vue';

/** What a `FormField` hands its control: the input id, the ids that describe it, and `'true'` while it shows an error. */
export interface FieldControl {
  id: string;
  describedBy: string | undefined;
  invalid: 'true' | undefined;
}

export const FIELD_CONTROL: InjectionKey<ComputedRef<FieldControl>> = Symbol('field-control');

/** The enclosing `FormField`'s control attributes, or none outside a field. */
export const useFieldControl = () => inject(FIELD_CONTROL, undefined);

/**
 * The frame every field shares ("Sơn mài" controls): 40 px (`--qh-control`, 44 on touch), the same 1 px control border and 4 px radius
 * as a button, the surface ground, 15 px text (16 on touch, styles.css, so iOS does not zoom), a muted placeholder. Focus is the
 * brand border with a soft brand ring; invalid a red border on the red tint; disabled 45 % opacity. `CONTROL_FRAME` goes on the
 * input, select or textarea itself (add the height); `FIELD_FRAME` on a wrapper that holds an icon or a unit beside a bare input.
 */
const FRAME =
  'min-w-0 rounded-control border border-line-control bg-surface px-(--qh-control-px-sm) text-body text-content';
export const CONTROL_FRAME = `${FRAME} w-full placeholder:text-muted focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent-soft aria-invalid:border-negative aria-invalid:bg-negative-bg disabled:cursor-not-allowed disabled:opacity-(--qh-opacity-disabled)`;
export const FIELD_FRAME = `${FRAME} flex h-(--qh-control) items-center gap-2 has-[:focus-visible]:border-accent has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-0 has-[:focus-visible]:outline-accent-soft has-aria-invalid:border-negative has-aria-invalid:bg-negative-bg has-disabled:cursor-not-allowed has-disabled:opacity-(--qh-opacity-disabled)`;
/** The bare input inside a `FIELD_FRAME`. */
export const FIELD_INPUT =
  'h-full min-w-0 flex-1 appearance-none bg-transparent text-body text-content outline-none placeholder:text-muted';
