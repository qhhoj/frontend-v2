import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { ok } from './mock-api';
import { profile, sessionUser, signedIn } from './fixtures';

export const STAFF_ID = '0192a000-0000-7000-8000-00000000a001';

/** The backend's site-wide creation scopes for these rights (`OrganizationCreationRights.scopes`); no administered organization. */
const siteCreation = (permissions: string[], isSuperuser: boolean) => ({
  organizations: false,
  problemCreation: {
    site: isSuperuser || permissions.includes('judge.add_problem'),
    organizations: false,
  },
  contestCreation: {
    site: isSuperuser || permissions.includes('judge.add_contest'),
    organizations: false,
  },
});

/** A signed-in staff member holding exactly `permissions` (the shell reads them from /auth/me). */
export const staffViewer = (
  permissions: string[] = [],
  overrides: { isSuperuser?: boolean } = {},
) => ({
  'GET /auth/me': signedIn({
    user: sessionUser({
      id: STAFF_ID,
      username: 'bitcoder',
      isStaff: true,
      permissions,
      adminCapabilities: siteCreation(permissions, overrides.isSuperuser ?? false),
      ...overrides,
    }),
  }),
  'GET /profile': ok(profile()),
});

export const superuserViewer = () => staffViewer([], { isSuperuser: true });

/** A `Switch` by its visible label: the switch is named through `aria-labelledby`, not `aria-label`. */
export function switchNamed(wrapper: Pick<VueWrapper, 'findAll' | 'get'>, label: string) {
  const found = wrapper
    .findAll('[role="switch"]')
    .find((node) => wrapper.get(`#${node.attributes('aria-labelledby')}`).text() === label);
  if (!found) throw new Error(`No switch "${label}"`);
  return found;
}

/** PrimeVue renders a dialog into `document.body`, not into the wrapper. The last one is on top (a confirm over a drawer). */
export function openDialog(): HTMLElement {
  const dialog = [...document.body.querySelectorAll<HTMLElement>('[role="dialog"]')].at(-1);
  if (!dialog) throw new Error('No dialog is open');
  return dialog;
}

function dialogButton(type: 'submit' | 'button', label: string): HTMLButtonElement {
  const button = [
    ...openDialog().querySelectorAll<HTMLButtonElement>(`button[type="${type}"]`),
  ].find((candidate) => candidate.textContent?.trim() === label);
  if (!button) throw new Error(`No ${type === 'submit' ? 'confirm' : 'cancel'} button "${label}"`);
  return button;
}

/**
 * The one way a spec confirms: the shared `src/components/ConfirmDialog.vue` has no test ids, its confirm button is the dialog's
 * submit button and is found by its label (`confirmLabel`).
 */
export async function confirmDialog(label: string) {
  dialogButton('submit', label).click();
  await flushPromises();
}

/** Presses the dialog's Cancel button (`common.cancel`, "Hủy", unless the consumer passed `cancelLabel`). */
export async function cancelDialog(label = 'Hủy') {
  dialogButton('button', label).click();
  await flushPromises();
}
