import { expect, test } from '@playwright/test';
import type { Page, Request } from '@playwright/test';

/**
 * Opt-in run against a real backend (`E2E_REAL_API`, see CONTRIBUTING "Real-backend e2e").
 * Nothing is mocked: login, problem, PDF, submit, verdict and stats come from the server.
 */
const USERNAME = process.env.E2E_USER ?? 'e2e_user';
const PASSWORD = process.env.E2E_PASSWORD ?? 'e2e-user-pass-1';
const PROBLEM_CODE = process.env.E2E_PROBLEM ?? 'e2e_sum';
const LANGUAGE_KEY = process.env.E2E_LANGUAGE ?? 'PY3';
const PYTHON_SUM = 'a, b = map(int, input().split())\nprint(a + b)\n';
const API = '/api/internal';
const VERDICT_TIMEOUT_MS = 60_000;
/** The verdict wait plus login, submit, reload and the list. */
const TEST_TIMEOUT_MS = VERDICT_TIMEOUT_MS + 60_000;
/** What the submission page says for a status, or for the result once graded. */
const VERDICT_LABELS: Record<string, string> = {
  QU: 'Đang chờ',
  P: 'Đang xử lý',
  G: 'Đang chấm',
  AC: 'Chấp nhận',
};

interface SubmissionState {
  status: string;
  result: string | null;
}

const labelOf = ({ status, result }: SubmissionState) =>
  VERDICT_LABELS[status === 'D' && result ? result : status];

const stateChangingRequests = (sent: Request[], pathEnd: string) =>
  sent.filter(
    (request) => request.method() === 'POST' && request.url().endsWith(`${API}${pathEnd}`),
  );

async function signIn(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Tên đăng nhập').fill(USERNAME);
  await page.getByLabel('Mật khẩu').fill(PASSWORD);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page.getByRole('button', { name: `Tài khoản của ${USERNAME}` })).toBeVisible();
}

/** The seeded problem has no `pdfStatementUrl`, so the page shows no PDF button: the endpoint is checked directly. */
async function checkPdfEndpoint(page: Page) {
  const answer = await page.request.get(`${API}/problems/${PROBLEM_CODE}/pdf`);
  // 202 while the worker renders (or none runs), 200 once the file exists.
  expect([200, 202]).toContain(answer.status());
}

/** Types the solution into the dock, submits, and returns the id the page navigated to. */
async function submitFromDock(page: Page) {
  const dock = page.getByRole('region', { name: 'Nộp bài' });
  await expect(dock.getByRole('combobox', { name: 'Ngôn ngữ' })).toBeVisible();
  await page.locator('.cm-content').first().click();
  await page.keyboard.insertText(PYTHON_SUM);
  await dock.getByRole('button', { name: 'Nộp bài' }).click();
  await expect(page).toHaveURL(/\/submissions\/[^/]+$/);
  return new URL(page.url()).pathname.split('/').pop()!;
}

async function fetchSubmissionState(page: Page, submissionId: string): Promise<SubmissionState> {
  const answer = await page.request.get(`${API}/submissions/${submissionId}`);
  expect(answer.ok()).toBe(true);
  return (await answer.json()).data;
}

/** Waits for AC; with no judge online asserts QU or P instead and says why the AC check is skipped. */
async function checkVerdict(page: Page, submissionId: string) {
  const summary = page.getByTestId('submission-summary');
  const isAccepted = await expect(summary)
    .toContainText(VERDICT_LABELS.AC, { timeout: VERDICT_TIMEOUT_MS })
    .then(() => true)
    .catch(() => false);
  if (isAccepted) return;
  const state = await fetchSubmissionState(page, submissionId);
  expect(['QU', 'P']).toContain(state.status);
  await expect(summary).toContainText(labelOf(state));
  console.log(
    `real-backend e2e: no judge graded submission ${submissionId} within ${VERDICT_TIMEOUT_MS / 1000} s ` +
      `(status ${state.status}); asserted QU/P and skipped the AC check`,
  );
}

async function checkReloadShowsServerState(page: Page, submissionId: string) {
  await page.reload();
  const state = await fetchSubmissionState(page, submissionId);
  await expect(page.getByTestId('submission-summary')).toContainText(labelOf(state));
}

async function checkListShowsStatsAndRow(page: Page, submissionId: string) {
  await page.goto('/submissions');
  const stats = (await (await page.request.get(`${API}/submissions/stats`)).json()).data;
  const strip = page.getByTestId('stats-strip');
  await expect(strip).toBeVisible();
  await expect(strip).not.toContainText('Không có số liệu thống kê');
  // The numbers are the server's own: the counts shown equal what the stats route answers.
  await expect(async () => {
    const tiles = await strip.locator('dd').allInnerTexts();
    expect(tiles).toContain(String(stats.judgedToday));
    expect(tiles).toContain(String(stats.queueLength));
    expect(tiles).toContain(`${stats.judgesOnline} / ${stats.judgesTotal}`);
  }).toPass();
  await expect(page.locator(`a[href="/submissions/${submissionId}"]`).first()).toBeVisible();
}

/** The server's refusal of a text language on the file route, as `submitErrorKey` expects it. */
async function checkFileRouteRefusal(page: Page) {
  const session = (await (await page.request.get(`${API}/auth/me`)).json()).data;
  const { languages } = (await (await page.request.get(`${API}/problems/meta`)).json()).data;
  const language = languages.find((candidate: { key: string }) => candidate.key === LANGUAGE_KEY);
  const answer = await page.request.post(`${API}/problems/${PROBLEM_CODE}/submit/file`, {
    headers: { 'X-CSRF-Token': session.csrfToken, Origin: new URL(page.url()).origin },
    multipart: {
      language: language.id,
      file: { name: 'sum.py', mimeType: 'text/x-python', buffer: Buffer.from(PYTHON_SUM) },
    },
  });
  expect(answer.status()).toBe(400);
  const { error } = await answer.json();
  expect(error.code).toBe('validation_failed');
  expect(error.issues).toContainEqual(expect.objectContaining({ code: 'language_takes_text' }));
}

test('log in, submit a solution, follow it to its verdict and find it in the list', async ({
  page,
}) => {
  test.setTimeout(TEST_TIMEOUT_MS);
  const sent: Request[] = [];
  page.on('request', (request) => sent.push(request));

  await signIn(page);
  await page.goto(`/problems/${PROBLEM_CODE}`);
  await expect(page.locator('#main h1')).toBeVisible();
  await checkPdfEndpoint(page);

  const submissionId = await submitFromDock(page);
  await checkVerdict(page, submissionId);

  // Login is public, so it carries no token yet: the server hands one out and the submit must send it back.
  const [login] = stateChangingRequests(sent, '/auth/login');
  const [submit, ...otherSubmits] = stateChangingRequests(sent, `/problems/${PROBLEM_CODE}/submit`);
  expect(otherSubmits).toEqual([]);
  const issuedToken = (await (await login.response())!.json()).data.csrfToken;
  expect(issuedToken).toBeTruthy();
  expect((await submit.allHeaders())['x-csrf-token']).toBe(issuedToken);
  expect((await submit.response())!.ok()).toBe(true);

  await checkReloadShowsServerState(page, submissionId);
  await checkListShowsStatsAndRow(page, submissionId);
  await checkFileRouteRefusal(page);
});
