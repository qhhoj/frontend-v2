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
 * The frame every text control shares: 16 px text, 12 px corners, the `line-control` border (3:1 on its ground, WCAG 1.4.11),
 * muted placeholder, a negative inset ring while invalid, the muted pair when disabled (no opacity). Height is added per control.
 */
export const CONTROL_FRAME =
  'w-full min-w-0 rounded-cell border border-line-control bg-surface-solid px-3 text-base text-content placeholder:text-muted aria-invalid:border-negative aria-invalid:inset-ring aria-invalid:inset-ring-negative disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-strong disabled:text-muted';
