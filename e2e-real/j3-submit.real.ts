import { expect, test } from '@playwright/test';
import type { Page, Request } from '@playwright/test';
import {
  API,
  getData,
  PYTHON_SUM,
  signIn,
  submitSource,
  VERDICT_LABELS,
  waitForEmptyQueue,
  WRONG_ANSWER_SOURCE,
} from './support';

/**
 * Opt-in run against a real backend (`E2E_REAL_API`, see CONTRIBUTING "Real-backend e2e").
 * Nothing is mocked: login, problem, PDF, submit, verdict and stats come from the server.
 */
const PROBLEM_CODE = process.env.E2E_PROBLEM ?? 'e2e_sum';
const LANGUAGE_KEY = process.env.E2E_LANGUAGE ?? 'PY3';
const MAX_SOLUTION = 'a, b = map(int, input().split())\nprint(max(a, b))\n';
const VERDICT_TIMEOUT_MS = 60_000;
/** The verdict wait plus login, submit, reload and the list. */
const TEST_TIMEOUT_MS = VERDICT_TIMEOUT_MS + 60_000;
interface SubmissionStats {
  judgedToday: number;
  acceptedToday: number;
  queueLength: number;
  judgesOnline: number;
  judgesTotal: number;
}

const STATS_LABELS = {
  judged: 'bài đã chấm hôm nay',
  accepted: 'được chấp nhận hôm nay',
  queue: 'đang chờ chấm',
  judges: 'máy chấm trực tuyến',
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

/** The seeded problem has no `pdfStatementUrl`, so the page shows no PDF button: the endpoint is checked directly. */
async function checkPdfEndpoint(page: Page) {
  const answer = await page.request.get(`${API}/problems/${PROBLEM_CODE}/pdf`);
  // 202 while the worker renders (or none runs), 200 once the file exists.
  expect([200, 202]).toContain(answer.status());
}

async function fetchSubmissionState(page: Page, submissionId: string): Promise<SubmissionState> {
  const answer = await page.request.get(`${API}/submissions/${submissionId}`);
  expect(answer.ok()).toBe(true);
  return (await answer.json()).data;
}

/** The fake judge is always online in the stack, so the submission must reach AC. */
async function checkVerdict(page: Page) {
  await expect(page.getByTestId('submission-summary')).toContainText(VERDICT_LABELS.AC, {
    timeout: VERDICT_TIMEOUT_MS,
  });
}

async function checkReloadShowsServerState(page: Page, submissionId: string) {
  await page.reload();
  const state = await fetchSubmissionState(page, submissionId);
  await expect(page.getByTestId('submission-summary')).toContainText(labelOf(state));
}

async function fetchStats(page: Page): Promise<SubmissionStats> {
  return (await (await page.request.get(`${API}/submissions/stats`)).json()).data;
}

/** The strip shows a dash, not 0%, while nothing was judged today. */
const acceptedText = (stats: SubmissionStats) =>
  stats.judgedToday > 0 ? `${Math.round((stats.acceptedToday / stats.judgedToday) * 100)}%` : '—';

async function checkListShowsStatsAndRow(page: Page, submissionId: string) {
  await page.goto('/submissions');
  const strip = page.getByTestId('stats-strip');
  await expect(strip).toBeVisible();
  await expect(strip).not.toContainText('Không có số liệu thống kê');
  // Tile by tile against the server's own numbers; read together so a changing queue cannot split them.
  await expect(async () => {
    const stats = await fetchStats(page);
    const tileValue = (label: string) =>
      strip.locator('dl', { hasText: label }).locator('dd').first();
    await expect(tileValue(STATS_LABELS.judged)).toHaveText(String(stats.judgedToday));
    await expect(tileValue(STATS_LABELS.accepted)).toHaveText(acceptedText(stats), {
      timeout: 1000,
    });
    await expect(tileValue(STATS_LABELS.queue)).toHaveText(String(stats.queueLength), {
      timeout: 1000,
    });
    await expect(tileValue(STATS_LABELS.judges)).toHaveText(
      `${stats.judgesOnline} / ${stats.judgesTotal}`,
      { timeout: 1000 },
    );
  }).toPass();
  await expect(page.locator(`a[href="/submissions/${submissionId}"]`).first()).toBeVisible();
}

/** The server's own refusal of a text language on the file route: the code and issue code `submitErrorKey` maps are the server's, not a fixture's. */
async function checkFileRouteRefusal(page: Page) {
  const session = (await (await page.request.get(`${API}/auth/me`)).json()).data;
  const { languages } = (await (await page.request.get(`${API}/problems/meta`)).json()).data;
  const language = languages.find((candidate: { key: string }) => candidate.key === LANGUAGE_KEY);
  expect(language, `language ${LANGUAGE_KEY} is not in /problems/meta`).toBeDefined();
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

/** Login is public, so it carries no token yet: the server hands one out and the submit must send it back. */
async function checkCsrfOnSubmit(sent: Request[]) {
  const [login] = stateChangingRequests(sent, '/auth/login');
  expect(login, 'no login request was captured').toBeDefined();
  const [submit, ...otherSubmits] = stateChangingRequests(sent, `/problems/${PROBLEM_CODE}/submit`);
  expect(submit, 'no submit request was captured').toBeDefined();
  expect(otherSubmits).toEqual([]);
  const issuedToken = (await (await login.response())!.json()).data.csrfToken;
  expect(issuedToken).toBeTruthy();
  expect((await submit.allHeaders())['x-csrf-token']).toBe(issuedToken);
  expect((await submit.response())!.ok()).toBe(true);
}

test('log in, submit a solution, follow it to its verdict and find it in the list', async ({
  page,
}) => {
  test.setTimeout(TEST_TIMEOUT_MS);
  const sent: Request[] = [];
  page.on('request', (request) => sent.push(request));

  await signIn(page);
  await waitForEmptyQueue(page);
  await page.goto(`/problems/${PROBLEM_CODE}`);
  await expect(page.locator('#main h1')).toBeVisible();
  await checkPdfEndpoint(page);

  const submissionId = await submitSource(page, PROBLEM_CODE, PYTHON_SUM);
  await checkVerdict(page);

  await checkCsrfOnSubmit(sent);

  await checkReloadShowsServerState(page, submissionId);
  await checkListShowsStatsAndRow(page, submissionId);
  await checkFileRouteRefusal(page);
});

test('a wrong-answer solution gets WA, and the submission page lists the failing case', async ({
  page,
}) => {
  test.setTimeout(TEST_TIMEOUT_MS);
  await signIn(page);
  await waitForEmptyQueue(page);
  const id = await submitSource(page, PROBLEM_CODE, WRONG_ANSWER_SOURCE);
  await expect(page.getByTestId('submission-summary')).toContainText(VERDICT_LABELS.WA, {
    timeout: VERDICT_TIMEOUT_MS,
  });
  const state = await getData<{ result: string; cases: unknown[] | null }>(
    page,
    `/submissions/${id}`,
  );
  expect(state.result).toBe('WA');
  expect(state.cases).toHaveLength(1);
  await expect(page.getByTestId('case-row')).toHaveCount(1);
});

test('the second problem is accepted case by case', async ({ page }) => {
  test.setTimeout(TEST_TIMEOUT_MS);
  await signIn(page);
  await waitForEmptyQueue(page);
  const id = await submitSource(page, 'e2e_max', MAX_SOLUTION);
  await expect(page.getByTestId('submission-summary')).toContainText(VERDICT_LABELS.AC, {
    timeout: VERDICT_TIMEOUT_MS,
  });
  const state = await getData<{ result: string; cases: unknown[] | null }>(
    page,
    `/submissions/${id}`,
  );
  expect(state.result).toBe('AC');
  expect(state.cases).toHaveLength(2);
  await expect(page.getByTestId('case-row')).toHaveCount(2);
});
