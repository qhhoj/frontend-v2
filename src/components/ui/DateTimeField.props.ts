/** The props of `DateTimeField`, shared with the admin shim `AdminDateTimeField`. */
export interface DateTimeFieldProps {
  label: string;
  hint?: string;
  error?: string;
  inputId?: string;
  required?: boolean;
  timeZone?: string;
  showNow?: boolean;
  dateOnly?: boolean;
  disabled?: boolean;
  scale?: 'meta' | 'admin';
}
