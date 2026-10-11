import { crc32 } from 'node:zlib';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  API,
  getData,
  PYTHON_SUM,
  signIn,
  submitSource,
  uniqueName,
  waitForEmptyQueue,
} from './support';

/** J10: a manually built problem judged by the teacher's own checker (testlib, then Themis), compile-checked on upload. Needs judge-v2 ≥ 2.3. */
const VERDICT_TIMEOUT_MS = 90_000;

const TESTLIB_CHECKER = `#include "testlib.h"
int main(int argc, char* argv[]) {
  registerTestlibCmd(argc, argv);
  long long expected = ans.readLong(), found = ouf.readLong();
  if (expected != found) quitf(_wa, "expected %lld, found %lld", expected, found);
  quitf(_ok, "ok");
}
`;
const BROKEN_CHECKER = `#include "testlib.h"
int main() { return not_declared_anywhere; }
`;
/** Themis convention: test and contestant directories on stdin, score 0..1 on the last stdout line. */
const THEMIS_CHECKER = `#include <fstream>
#include <iostream>
#include <string>
int main() {
  std::string test, work;
  std::getline(std::cin, test);
  std::getline(std::cin, work);
  std::ifstream answer(test + "/sum.out"), output(work + "/sum.out");
  long long expected = 0, found = 0;
  answer >> expected;
  if (!(output >> found)) { std::cout << "no output\\n0\\n"; return 0; }
  std::cout << (expected == found ? "Correct\\n1\\n" : "Wrong\\n0\\n");
}
`;
const WRONG_SUM = 'a, b = map(int, input().split())\nprint(a - b)\n';
const FILE_IO_SUM =
  "a, b = map(int, open('sum.inp').read().split())\nopen('sum.out', 'w').write(str(a + b))\n";
const FILE_IO_WRONG =
  "a, b = map(int, open('sum.inp').read().split())\nopen('sum.out', 'w').write(str(a - b))\n";

/** A stored (uncompressed) zip; enough for a test archive without a zip dependency. */
function storedZip(files: Record<string, string>): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const fileName = Buffer.from(name);
    const data = Buffer.from(text);
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x21, 12);
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
    central.writeUInt32LE(offset, 42);
    locals.push(local, fileName, data);
    centrals.push(central, fileName);
    offset += local.length + fileName.length + data.length;
  }
  const directory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(centrals.length / 2, 8);
  end.writeUInt16LE(centrals.length / 2, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, end]);
}

async function send(page: Page, method: 'POST' | 'PUT', path: string, body: object) {
  const { csrfToken } = await getData<{ csrfToken: string }>(page, '/auth/me');
  const headers = { 'X-CSRF-Token': csrfToken, Origin: new URL(page.url()).origin };
  const answer = await page.request.fetch(`${API}${path}`, {
    method,
    headers,
    ...('file' in body ? { multipart: body as never } : { data: body }),
  });
  expect(answer.ok(), `${method} ${path}: ${answer.status()} ${await answer.text()}`).toBe(true);
}

interface SubmissionState {
  status: string;
  result: string | null;
}
const finalCode = ({ status, result }: SubmissionState) =>
  ['CE', 'IE', 'AB'].includes(status) ? status : status === 'D' ? result : null;

async function expectVerdict(page: Page, code: string, source: string, verdict: string) {
  await waitForEmptyQueue(page);
  const id = await submitSource(page, code, source);
  await expect
    .poll(async () => finalCode(await getData<SubmissionState>(page, `/submissions/${id}`)), {
      timeout: VERDICT_TIMEOUT_MS,
    })
    .toBe(verdict);
}

const config = (checkerArgs: object, graderArgs: object | null = null) => ({
  checker: 'bridged',
  checkerArgs,
  grader: 'standard',
  graderArgs,
  outputPrefix: null,
  outputLimit: null,
  unicode: false,
  nobigmath: false,
  cases: ['1', '2'].map((test) => ({
    type: 'C',
    input: `${test}.in`,
    output: `${test}.out`,
    points: 50,
    isPretest: false,
    generatorArgs: '',
    checker: '',
    checkerArgs: null,
    outputPrefix: null,
    outputLimit: null,
  })),
});

async function uploadChecker(page: Page, name: string, source: string) {
  await page
    .getByTestId('source-customChecker')
    .locator('input[type="file"]')
    .setInputFiles({ name, mimeType: 'text/plain', buffer: Buffer.from(source) });
}

test.describe('J10 custom checkers', () => {
  test.setTimeout(6 * 60_000);

  test('a testlib checker is compile-checked on upload and judges AC and WA; then the Themis convention does too', async ({
    page,
  }) => {
    await signIn(page, 'admin');
    const code = uniqueName('chk').toLowerCase();
    await page.goto('/admin/problems/new');
    await page.getByRole('textbox', { name: /^Mã bài/ }).fill(code);
    await page.getByRole('textbox', { name: /^Tên bài/ }).fill(`Checker ${code}`);
    await page.getByLabel('Chọn loại bài').selectOption({ label: 'Uncategorized' });
    await page.getByRole('button', { name: 'Thêm loại' }).click();
    await page.getByRole('button', { name: 'Tạo bài' }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/problems/${code}`));

    const tests = { '1.in': '1 2\n', '1.out': '3\n', '2.in': '40 2\n', '2.out': '42\n' };
    await send(page, 'POST', `/problems/${code}/data/archive`, {
      file: { name: 'tests.zip', mimeType: 'application/zip', buffer: storedZip(tests) },
    });
    await send(page, 'PUT', `/problems/${code}/data`, config({ type: 'testlib' }));

    await page.goto(`/admin/problems/${code}/data`);
    await expect(page.getByTestId('data-checker-family-testlib').locator('input')).toBeChecked();
    await uploadChecker(page, 'broken.cpp', BROKEN_CHECKER);
    await expect(page.getByTestId('compile-error')).toBeVisible({ timeout: VERDICT_TIMEOUT_MS });
    await expect(page.getByTestId('compile-error')).toContainText('not_declared_anywhere');
    await page.screenshot({ path: 'test-results/j10-compile-error.png', fullPage: true });

    await uploadChecker(page, 'chk.cpp', TESTLIB_CHECKER);
    await expect(page.getByTestId('compile-ok')).toBeVisible({ timeout: VERDICT_TIMEOUT_MS });
    await page.screenshot({ path: 'test-results/j10-compile-ok.png', fullPage: true });

    await expectVerdict(page, code, PYTHON_SUM, 'AC');
    await expectVerdict(page, code, WRONG_SUM, 'WA');

    // Themis: same tests, files named by the problem's file I/O and the checker's literals
    await page.goto(`/admin/problems/${code}/data`);
    await uploadChecker(page, 'themis.cpp', THEMIS_CHECKER);
    await expect(page.getByTestId('compile-ok')).toBeVisible({ timeout: VERDICT_TIMEOUT_MS });
    await send(
      page,
      'PUT',
      `/problems/${code}/data`,
      config(
        { type: 'themis' },
        { io_method: 'file', io_input_file: 'sum.inp', io_output_file: 'sum.out' },
      ),
    );
    await expectVerdict(page, code, FILE_IO_SUM, 'AC');
    await expectVerdict(page, code, FILE_IO_WRONG, 'WA');
  });
});
