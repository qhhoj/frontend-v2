import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export type Role = 'user' | 'admin';
export const API = '/api/internal';

/** The seed's passwords are random per stack: `source $RUN/env` exports them. */
export const CREDENTIALS: Record<Role, { username: string; password: string }> = {
  user: {
    username: process.env.E2E_USER ?? 'e2e_user',
    password: process.env.E2E_USER_PASSWORD ?? process.env.E2E_PASSWORD ?? 'e2e-user-pass-1',
  },
  admin: { username: 'e2e_admin', password: process.env.E2E_ADMIN_PASSWORD ?? 'e2e-admin-pass-1' },
};

export const SEEDED = {
  problems: ['e2e_sum', 'e2e_max'],
  liveContest: 'e2e_live',
  pastContest: 'e2e_past',
} as const;

export const VERDICT_LABELS: Record<string, string> = {
  QU: 'Đang chờ',
  P: 'Đang xử lý',
  G: 'Đang chấm',
  AC: 'Chấp nhận',
  WA: 'Sai kết quả',
};

export const PYTHON_SUM = 'a, b = map(int, input().split())\nprint(a + b)\n';
/** The fake judge answers WA when the source contains this comment. */
export const WRONG_ANSWER_SOURCE = `${process.env.FAKE_JUDGE_SOURCE_WA ?? '# fake-judge:WA'}\nprint(0)\n`;

export const uniqueName = (prefix: string) => `${prefix}_${Date.now().toString(36)}`;

/** Fills and submits the login form already on screen. */
export async function submitLoginForm(page: Page, username: string, password: string) {
  await page.getByLabel('Tên đăng nhập').fill(username);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
}

export async function signIn(page: Page, role: Role = 'user'): Promise<void> {
  const { username, password } = CREDENTIALS[role];
  await page.goto('/login');
  await submitLoginForm(page, username, password);
  await expect(page.getByRole('button', { name: `Tài khoản của ${username}` })).toBeVisible();
}

export async function signOut(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^Tài khoản của / }).click();
  await page.getByRole('menuitem', { name: 'Đăng xuất' }).click();
  await expect(page.getByRole('link', { name: 'Đăng nhập', exact: true }).first()).toBeVisible();
}

/** The server's `{ data }` envelope; a non-200 or a missing `data` fails the test with the body. */
export async function getData<T>(page: Page, path: string): Promise<T> {
  const answer = await page.request.get(`${API}${path}`);
  expect(answer.status(), `GET ${path}: ${await answer.text()}`).toBe(200);
  const body = await answer.json();
  expect(body, `GET ${path} has no data envelope`).toHaveProperty('data');
  return body.data as T;
}

/** Sends the CSRF token and an Origin; needs a page that has navigated, since `about:blank` has no origin. */
export async function postData<T>(page: Page, path: string, body: object = {}): Promise<T> {
  if (page.url() === 'about:blank') await page.goto('/');
  const session = await getData<{ csrfToken: string }>(page, '/auth/me');
  const answer = await page.request.post(`${API}${path}`, {
    data: body,
    headers: { 'X-CSRF-Token': session.csrfToken, Origin: new URL(page.url()).origin },
  });
  expect(answer.ok(), `POST ${path}: ${answer.status()} ${await answer.text()}`).toBe(true);
  return ((await answer.json()) as { data: T }).data;
}

/** Types the source into the problem page's dock, submits, and returns the id the page navigated to. */
export async function submitSource(page: Page, code: string, source: string): Promise<string> {
  await page.goto(`/problems/${code}`);
  const dock = page.getByRole('region', { name: 'Nộp bài' });
  await expect(dock.getByRole('combobox', { name: 'Ngôn ngữ' })).toBeVisible();
  await page.locator('.cm-content').first().click();
  await page.keyboard.insertText(source);
  await dock.getByRole('button', { name: 'Nộp bài' }).click();
  await expect(page).toHaveURL(/\/submissions\/[^/]+$/);
  return new URL(page.url()).pathname.split('/').pop()!;
}

/** The user may hold two unfinished submissions; wait for the judge to drain before submitting more. */
export async function waitForEmptyQueue(page: Page): Promise<void> {
  await expect
    .poll(
      async () => (await getData<{ queueLength: number }>(page, '/submissions/stats')).queueLength,
      {
        timeout: 60_000,
      },
    )
    .toBe(0);
}

/** A hold file the fake judge honours (backend `fake-judge-cli.ts`); needs `FULLSTACK_CONTROL_DIR` from `$RUN/env`. */
export function gate(stage: 'ack' | 'begin' | 'end') {
  const dir = process.env.FULLSTACK_CONTROL_DIR;
  if (!dir) throw new Error('FULLSTACK_CONTROL_DIR is not set: source $RUN/env before running');
  const file = join(dir, `hold-${stage}`);
  return {
    hold: () => {
      mkdirSync(dir, { recursive: true });
      writeFileSync(file, '');
    },
    release: () => rmSync(file, { force: true }),
  };
}
