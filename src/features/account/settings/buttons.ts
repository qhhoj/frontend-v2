import { buttonClasses } from '@/components/ui/button-classes';

/**
 * Board `.btn` variants, so every settings button looks alike (the `pill` shape of the shared recipe). A pending or not-yet-allowed
 * primary button wears the accent-soft pair, like `AuthSubmit` and the shared `ConfirmDialog`. Danger is outlined.
 */
export const BUTTON = {
  primary: buttonClasses({ tone: 'primary', shape: 'pill' }),
  secondary: buttonClasses({ tone: 'secondary', shape: 'pill' }),
  danger: buttonClasses({ tone: 'danger', shape: 'pill' }),
} as const;
