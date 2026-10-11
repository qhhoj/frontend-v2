import type { Locator, Page } from '@playwright/test';
import { profile, sessionResponse, sessionUser } from '../../src/test/fixtures';
import type { FakeApi } from './api';

export const adminOk = (data: unknown) => ({ body: { data } });
export const adminList = (items: unknown[], meta: Record<string, unknown> = {}) => ({
  body: { data: items, meta: { page: 1, pageSize: 50, total: items.length, ...meta } },
});

/** FakeApi's own session is non-staff: replace `/auth/me` with a staff member holding `permissions`. */
export function signInAsStaff(api: FakeApi, permissions: string[], isSuperuser = false) {
  api.signedIn = true;
  api.routes['GET /auth/me'] = adminOk(
    sessionResponse({
      user: sessionUser({ username: 'minhthu', isStaff: true, isSuperuser, permissions }),
    }),
  );
  api.routes['GET /profile'] = adminOk(profile());
}

/** The open ConfirmDialog (the shared `src/components/ConfirmDialog.vue` has no test ids). */
/** The dialog on top: a confirm opened over a drawer is the last one. */
export const dialogOf = (page: Page): Locator => page.getByRole('dialog').last();

/** Presses the confirm button of the open ConfirmDialog by its label; cancel is `dialogOf(page).getByRole('button', { name: 'Hủy' })`. */
export const confirmInDialog = (page: Page, label: string) =>
  dialogOf(page).getByRole('button', { name: label, exact: true }).click();
