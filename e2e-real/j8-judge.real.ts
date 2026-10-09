import { crc32 } from 'node:zlib';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { API, gate, getData, PYTHON_SUM, signIn, submitSource, waitForEmptyQueue } from './support';

/** J8: what only a real judge produces: CE, TLE, an abort while the judge holds the run, and an OUTPUT zip fetched over FetchSource. */
const VERDICT_TIMEOUT_MS = 60_000;
const OUTPUT_PROBLEM = 'e2e_output';

interface SubmissionState {
  status: string;
  result: string | null;
}

/** CE, IE and AB are final statuses; otherwise the result once the status is D. */
const finalCode = ({ status, result }: SubmissionState): string | null =>
  ['CE', 'IE', 'AB'].includes(status) ? status : status === 'D' ? result : null;

const stateOf = (page: Page, id: string) => getData<SubmissionState>(page, `/submissions/${id}`);

async function expectFinal(page: Page, id: string, code: string): Promise<void> {
  await expect
    .poll(async () => finalCode(await stateOf(page, id)), { timeout: VERDICT_TIMEOUT_MS })
    .toBe(code);
}

/** POST with the session's CSRF token; returns the response so 204 routes can be checked. */
async function post(
  page: Page,
  path: string,
  multipart?: Record<string, string | { name: string; mimeType: string; buffer: Buffer }>,
) {
  const { csrfToken } = await getData<{ csrfToken: string }>(page, '/auth/me');
  const headers = { 'X-CSRF-Token': csrfToken, Origin: new URL(page.url()).origin };
  return page.request.post(
    `${API}${path}`,
    multipart ? { headers, multipart } : { headers, data: {} },
  );
}

/** A one-entry zip, stored (no compression): enough for an OUTPUT submission without a zip dependency. */
function storedZip(name: string, text: string): Buffer {
  const fileName = Buffer.from(name);
  const data = Buffer.from(text);
  const crc = crc32(data);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x21, 12); // 1980-01-01
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(fileName.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x21, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(data.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(fileName.length, 28);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(1, 8);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(central.length + fileName.length, 12);
  end.writeUInt32LE(local.length + fileName.length + data.length, 16);
  return Buffer.concat([local, fileName, data, central, fileName, end]);
}

test.describe('J8 real judge verdicts', () => {
  test.setTimeout(VERDICT_TIMEOUT_MS + 60_000);

  test('a Python syntax error is a compile error', async ({ page }) => {
    await signIn(page);
    await waitForEmptyQueue(page);
    const id = await submitSource(page, 'e2e_sum', 'print(\n');
    await expectFinal(page, id, 'CE');
  });

  test('an endless loop is a time limit exceeded', async ({ page }) => {
    await signIn(page);
    await waitForEmptyQueue(page);
    const id = await submitSource(page, 'e2e_sum', 'while True:\n    pass\n');
    await expectFinal(page, id, 'TLE');
  });

  test('aborting a run the judge holds at begin ends it aborted', async ({ page }) => {
    const begin = gate('begin');
    try {
      await signIn(page);
      await waitForEmptyQueue(page);
      begin.hold();
      const id = await submitSource(page, 'e2e_sum', PYTHON_SUM);
      // The judge has accepted the run (processing) and waits at hold-begin.
      await expect
        .poll(async () => (await stateOf(page, id)).status, { timeout: VERDICT_TIMEOUT_MS })
        .toBe('P');
      const answer = await post(page, `/submissions/${id}/abort`);
      expect(answer.status(), await answer.text()).toBe(204);
      begin.release();
      await expectFinal(page, id, 'AB');
    } finally {
      begin.release();
    }
  });

  test('an OUTPUT zip is fetched over FetchSource and accepted', async ({ page }) => {
    await signIn(page, 'admin');
    await waitForEmptyQueue(page);
    const problem = await getData<{ allowedLanguages: { id: string; key: string }[] }>(
      page,
      `/problems/${OUTPUT_PROBLEM}`,
    );
    const output = problem.allowedLanguages.find((language) => language.key === 'OUTPUT');
    expect(output, 'the seed allows OUTPUT on e2e_output').toBeDefined();
    const answer = await post(page, `/problems/${OUTPUT_PROBLEM}/submit/file`, {
      language: output!.id,
      file: { name: 'answers.zip', mimeType: 'application/zip', buffer: storedZip('1.out', '3\n') },
    });
    expect(answer.ok(), await answer.text()).toBe(true);
    const { id } = ((await answer.json()) as { data: { id: string } }).data;
    await expectFinal(page, id, 'AC');
  });
});
