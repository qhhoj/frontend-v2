/**
 * Old names for the admin control classes, kept until every screen adopts `controls.ts` (the last screen PR removes this file).
 * They point at the new classes, so unmigrated screens already get the admin density and radius.
 */
import { BUTTON, CHECK_CHIP, INPUT, TOGGLE } from './controls';

/** @deprecated use `INPUT` from `./controls` */
export const ADMIN_INPUT_CLASS = INPUT;
/** @deprecated use `BUTTON.secondary` or `buttonClass()` from `./controls` */
export const ADMIN_BUTTON_CLASS = BUTTON.secondary;
/** @deprecated use `BUTTON.primary` from `./controls` */
export const ADMIN_PRIMARY_CLASS = BUTTON.primary;
/** @deprecated use `BUTTON.danger` from `./controls` */
export const ADMIN_DANGER_CLASS = BUTTON.danger;
/** @deprecated use `CHECK_CHIP` from `./controls` */
export const ADMIN_CHECK_CHIP_CLASS = CHECK_CHIP;
/** @deprecated use `TOGGLE` from `./controls` */
export const ADMIN_TOGGLE_CLASS = TOGGLE;
