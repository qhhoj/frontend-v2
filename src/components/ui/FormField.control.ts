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
 * The frame every text control shares (Kit 2): 15 px text on a 1.5 line (16 px on touch, styles.css, so iOS does not zoom), the strong surface (L2)
 * with no line (contrast-high mode adds a 1 px edge, `edge-high`), muted placeholder, a red tint and ring while invalid (the one
 * state that draws a line), muted text when disabled (no opacity). Height and radius are added per control: a pill for a
 * line, the surface radius for a multi-line field.
 */
export const CONTROL_FRAME =
  'edge-high w-full min-w-0 bg-surface-strong px-(--qh-control-px) text-body text-content placeholder:text-muted aria-invalid:bg-negative-bg aria-invalid:inset-ring aria-invalid:inset-ring-negative disabled:cursor-not-allowed disabled:text-muted';
