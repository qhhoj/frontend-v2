import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { profile } from '../../src/test/fixtures';
import { THEMES } from '../../src/theme/registry';
import type { ThemeDefinition } from '../../src/theme/registry';
import { expect } from './api';
import type { FakeApi } from './api';

export const AUDIT_VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'phone 375 px', width: 375, height: 812 },
] as const;

/**
 * `E2E_FULL=1` (the manual CI run) audits every theme, and the page matrix at every viewport. The local gate audits
 * the default theme only: contrast per theme is already checked token by token in `themes.node.spec.ts`.
 */
export const FULL_AUDIT = Boolean(process.env.E2E_FULL);
export const AUDIT_THEMES = FULL_AUDIT ? THEMES : THEMES.slice(0, 1);

/** Puts the page in `theme` for sure: the OS scheme only selects Clay, and a signed-in account's theme outranks the browser's. */
export async function applyTheme(page: Page, api: FakeApi, theme: ThemeDefinition) {
  api.routes['GET /profile'] = { body: { data: profile({ siteTheme: theme.id }) } };
  await page.emulateMedia({ colorScheme: theme.scheme });
  await page.addInitScript((id) => localStorage.setItem('qhhoj.theme', id), theme.id);
}

/** WCAG 2.1 A/AA on the whole body by default: the dock, the sheet and body-appended overlays sit outside `#main`. Empty when clean. */
export async function axeViolationsIn(page: Page, selector = 'body') {
  const { violations } = await new AxeBuilder({ page })
    .include(selector)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  return violations.map(
    (violation) =>
      `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
  );
}

export async function expectNoAxeViolations(page: Page) {
  expect(await axeViolationsIn(page)).toEqual([]);
}
