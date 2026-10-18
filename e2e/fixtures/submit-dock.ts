import type { Page } from '@playwright/test';
import { expect } from './api';

/** The desktop dock, or the phone sheet's bar: the one region named after the submit flow. */
export const dockOf = (page: Page) => page.getByRole('region', { name: 'Nộp bài' });

/** Exact: the dock's close button, "Đóng khung nộp bài", also contains these words. */
export const dockSubmitButton = (page: Page) =>
  dockOf(page).getByRole('button', { name: 'Nộp bài', exact: true });

/** P-02 B: beside the statement the rail card's "Nộp bài" is the only way into the submit flow. */
export const railSubmitButton = (page: Page) =>
  page.getByTestId('rail-submit').getByRole('button', { name: 'Nộp bài' });

/** The dock starts closed on a computer: opens it the way a visitor does, and waits for it. */
export async function openDock(page: Page) {
  await railSubmitButton(page).click();
  await expect(dockOf(page)).toBeVisible();
}
