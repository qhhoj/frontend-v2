import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { profile } from '../../src/test/fixtures';
import type { ThemeDefinition } from '../../src/theme/registry';
import { expect } from './api';
import type { FakeApi } from './api';

export const AUDIT_VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'phone 375 px', width: 375, height: 812 },
] as const;

/** Puts the page in `theme` for sure: the OS scheme only selects Clay, and a signed-in account's theme outranks the browser's. */
export async function applyTheme(page: Page, api: FakeApi, theme: ThemeDefinition) {
  api.routes['GET /profile'] = { body: { data: profile({ siteTheme: theme.id }) } };
  await page.emulateMedia({ colorScheme: theme.scheme });
  await page.addInitScript((id) => localStorage.setItem('qhhoj.theme', id), theme.id);
}

/** WCAG 2.1 A/AA on `#main` (the shell has its own audit); empty when clean. */
export async function axeViolationsIn(page: Page, selector = '#main') {
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
