import type { Page } from '@playwright/test';
import {
  CPP17_ID,
  PY3_ID,
  SCRATCH_ID,
  languageItem,
  problemDetail,
  submissionDetail,
} from '../src/test/fixtures';
import { THEMES } from '../src/theme/registry';
import { expect, pdfReady, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { applyTheme } from './fixtures/audit';

const DESKTOP = { width: 1280, height: 900 };
const OVER_LIMIT_LENGTH = 65_537;
/** Long enough for a stray late POST to show up in the request log. */
const REFUSAL_WAIT_MS = 500;
/** The first poll answers 202 with a 3 s wait; the PDF is ready on the next one. */
const PDF_READY_TIMEOUT_MS = 8000;
const dockOf = (page: Page) => page.getByRole('region', { name: 'Nộp bài' });
const submitButton = (page: Page) => dockOf(page).getByRole('button', { name: 'Nộp bài' });

async function openProblem(page: Page, api: FakeApi, path = '/problems/duongdi') {
  api.signedIn = true;
  await page.setViewportSize(DESKTOP);
  await page.goto(path);
  await expect(page.locator('#main h1')).toBeVisible();
}
const typeCode = async (page: Page, code: string) => {
  await page.locator('.cm-content').first().click();
  await page.keyboard.insertText(code);
};

test('a problem opens from the list and shows its statement and limits', async ({ page, api }) => {
  void api;
  await page.setViewportSize(DESKTOP);
  await page.goto('/problems');
  await page.getByRole('link', { name: 'Đường đi ngắn nhất', exact: true }).first().click();
  await expect(page).toHaveURL(/\/problems\/(duongdi|sp)$/);
  await expect(page.locator('#main h1')).toHaveText('Đường đi ngắn nhất');
  await expect(page.locator('.statement')).toContainText('Thành phố có n nút giao thông.');
  const limits = page.getByTestId('limits');
  for (const label of ['Thời gian', 'Bộ nhớ', 'Điểm', 'Tỉ lệ AC'])
    await expect(limits.getByText(label, { exact: true })).toBeVisible();
  await expect(limits).toContainText('38,4%');
});

test('the tabs move with the arrow keys and show the editorial', async ({ page, api }) => {
  void api;
  await page.goto('/problems/duongdi');
  const statementTab = page.getByRole('tab', { name: 'Đề bài' });
  await statementTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Lời giải' })).toBeFocused();
  await expect(page.getByRole('tab', { name: 'Lời giải' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.locator('.user-content')).toContainText('Dùng Dijkstra.');
  await page.keyboard.press('Home');
  await expect(statementTab).toHaveAttribute('aria-selected', 'true');
});

test('the copy button puts the sample on the clipboard', async ({ page, api, context }) => {
  void api;
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/problems/duongdi');
  await page.locator('.statement button.copy-block').first().click();
  await expect(page.locator('.statement button.copy-block').first()).toHaveText('Đã chép');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('4 4\n1 2 5');
});

test('the PDF button turns into an Open PDF link, announces it once and the last reply is the PDF', async ({
  page,
  api,
}) => {
  let asked = 0;
  api.routes['GET /problems/duongdi'] = {
    body: {
      data: problemDetail(),
    },
  };
  api.routes['GET /problems/duongdi/pdf'] = () =>
    asked++ === 0
      ? {
          status: 202,
          headers: { 'Retry-After': '3', 'Cache-Control': 'no-store' },
          body: { data: { status: 'rendering' } },
        }
      : pdfReady;
  await page.goto('/problems/duongdi');
  await page.getByTestId('pdf-button').click();
  await expect(page.locator('#main button[aria-busy="true"]')).toBeVisible();
  const link = page.getByRole('link', { name: 'Mở PDF' });
  await expect(link).toBeVisible({ timeout: PDF_READY_TIMEOUT_MS });
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(page.locator('#main [role="status"]', { hasText: 'PDF đã sẵn sàng' })).toHaveCount(
    1,
  );
  const replies = api.requestsTo('GET /problems/duongdi/pdf');
  expect(replies.at(-1)).toMatchObject({ replyStatus: 200, replyContentType: 'application/pdf' });
});

test.describe('the submit dock', () => {
  test('counts typed characters', async ({ page, api }) => {
    await openProblem(page, api);
    const counter = dockOf(page).getByTestId('source-counter');
    const before = await counter.innerText();
    await typeCode(page, 'return 0;');
    await expect.poll(() => counter.innerText()).not.toBe(before);
  });

  for (const theme of THEMES)
    test(`colours a keyword with the syntax token of ${theme.id}`, async ({ page, api }) => {
      await applyTheme(page, api, theme);
      await openProblem(page, api);
      await typeCode(page, 'int main() { return 0; }');
      const keyword = dockOf(page).locator('.cm-content span', { hasText: /^return$/ });
      await expect(keyword).toBeVisible();
      const colours = await page.evaluate(() => {
        const probe = document.createElement('i');
        probe.style.color = 'var(--qh-syntax-keyword)';
        document.body.append(probe);
        const resolved = getComputedStyle(probe).color;
        probe.remove();
        const keywordSpan = [...document.querySelectorAll('.cm-content span')].find(
          (span) => span.textContent === 'return',
        )!;
        return {
          resolved,
          keyword: getComputedStyle(keywordSpan).color,
          plain: getComputedStyle(document.querySelector('.cm-content')!).color,
        };
      });
      expect(colours.keyword).toBe(colours.resolved);
      expect(colours.keyword).not.toBe(colours.plain);
    });

  test('shows a language without a highlighter as plain text and raises no page error', async ({
    page,
    api,
  }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => pageErrors.push(error));
    api.routes['GET /problems/pascal'] = {
      body: {
        data: problemDetail({
          code: 'pascal',
          allowedLanguages: [languageItem(CPP17_ID, 'PAS', 'Pascal', { ace: 'pascal' })],
        }),
      },
    };
    await openProblem(page, api, '/problems/pascal');
    await typeCode(page, 'begin writeln(1); end.');
    await expect(dockOf(page).locator('.cm-content')).toContainText('writeln');
    const colours = await dockOf(page)
      .locator('.cm-content span')
      .evaluateAll((spans) => new Set(spans.map((span) => getComputedStyle(span).color)).size);
    expect(colours).toBeLessThanOrEqual(1);
    expect(pageErrors).toEqual([]);
  });

  test('submits with the CSRF header and lands on the new submission', async ({ page, api }) => {
    api.routes['GET /submissions/sub-9'] = { body: { data: submissionDetail({ id: 'sub-9' }) } };
    await openProblem(page, api);
    await typeCode(page, 'int main() {}');
    await submitButton(page).click();
    await expect(page).toHaveURL(/\/submissions\/sub-9$/);
    await expect(page.getByTestId('score')).toBeVisible();
    const [sent] = api.requestsTo('POST /problems/duongdi/submit');
    expect(sent?.headers['x-csrf-token']).toBe('csrf-1');
  });

  const pasteSource = (page: Page, length: number) =>
    page.evaluate((count) => {
      const data = new DataTransfer();
      data.setData('text/plain', 'x'.repeat(count));
      document
        .querySelector('.cm-content')!
        .dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true }));
    }, length);

  test('refuses an over-limit source without asking the server, while the same flow in the limit posts once', async ({
    page,
    api,
  }) => {
    api.routes['GET /submissions/sub-9'] = { body: { data: submissionDetail({ id: 'sub-9' }) } };
    await openProblem(page, api);
    await page.locator('.cm-content').first().click();
    await pasteSource(page, OVER_LIMIT_LENGTH);
    await expect(dockOf(page).getByTestId('source-counter')).toHaveClass(/text-negative/);
    // aria-disabled keeps the button focusable, so the click reaches the handler and must be refused there.
    await submitButton(page).click({ force: true });
    await page.waitForTimeout(REFUSAL_WAIT_MS);
    expect(api.requestsTo('POST /problems/duongdi/submit')).toEqual([]);

    // Positive control: the same clicks send the request once as soon as the source fits.
    await page.locator('.cm-content').first().click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');
    await page.keyboard.insertText('int main() {}');
    await expect(dockOf(page).getByTestId('source-counter')).not.toHaveClass(/text-negative/);
    await submitButton(page).click();
    await expect(page).toHaveURL(/\/submissions\/sub-9$/);
    expect(api.requestsTo('POST /problems/duongdi/submit')).toHaveLength(1);
  });

  test('offers an anonymous visitor a sign-in link that comes back to the problem', async ({
    page,
    api,
  }) => {
    void api;
    await page.setViewportSize(DESKTOP);
    await page.goto('/problems/duongdi');
    await expect(dockOf(page).getByRole('link', { name: 'Đăng nhập để nộp bài' })).toHaveAttribute(
      'href',
      '/login?redirect=/problems/duongdi',
    );
  });

  test('prefills the language and source from ?resubmit=', async ({ page, api }) => {
    api.routes['GET /submissions/old-1'] = {
      body: {
        data: submissionDetail({
          id: 'old-1',
          language: { id: PY3_ID, key: 'PY3', name: 'Python 3' },
        }),
      },
    };
    api.routes['GET /submissions/old-1/source'] = {
      body: { data: { id: 'old-1', source: 'print(42)\n' } },
    };
    await openProblem(page, api, '/problems/duongdi?resubmit=old-1');
    await expect(dockOf(page).getByRole('combobox', { name: 'Ngôn ngữ' })).toContainText(
      'Python 3',
    );
    await expect(dockOf(page).locator('.cm-content')).toContainText('print(42)');
    await expect(page).not.toHaveURL(/resubmit/);
  });
});

const pickScratch = async (page: Page) => {
  await dockOf(page).getByRole('combobox', { name: 'Ngôn ngữ' }).click();
  await page.getByRole('option', { name: /Scratch 3/ }).click();
};

test.describe('a file-only language', () => {
  test('rejects a wrong extension and sends a multipart upload for the right one', async ({
    page,
    api,
  }) => {
    api.routes['GET /submissions/sub-9'] = { body: { data: submissionDetail({ id: 'sub-9' }) } };
    await openProblem(page, api);
    await pickScratch(page);
    const input = dockOf(page).locator('input[type="file"]');
    await input.setInputFiles({
      name: 'wrong.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('x'),
    });
    await expect(dockOf(page).getByText('Tệp phải có đuôi', { exact: false })).toBeVisible();
    await input.setInputFiles({
      name: 'catmaze-final.sb3',
      mimeType: 'application/zip',
      buffer: Buffer.from('x'),
    });
    await expect(dockOf(page).getByText('catmaze-final.sb3')).toBeVisible();
    await dockOf(page).getByRole('button', { name: 'Nộp tệp' }).click();
    await expect(page).toHaveURL(/\/submissions\/sub-9$/);
    const [sent] = api.requestsTo('POST /problems/duongdi/submit/file');
    expect(sent?.headers['content-type']).toMatch(/^multipart\/form-data/);
    const body = sent?.postData?.toString('latin1') ?? '';
    expect(body).toContain(SCRATCH_ID);
    expect(body).toContain('catmaze-final.sb3');
  });

  test('shows a disabled dropzone and no input when the language takes no upload', async ({
    page,
    api,
  }) => {
    api.routes['GET /problems/noupload'] = {
      body: {
        data: problemDetail({
          code: 'noupload',
          allowedLanguages: [
            languageItem(CPP17_ID, 'CPP17', 'C++17'),
            languageItem(SCRATCH_ID, 'SCRATCH', 'Scratch 3', {
              fileOnly: true,
              fileSizeLimit: 0,
              extension: 'sb3',
              ace: 'text',
            }),
          ],
        }),
      },
    };
    await openProblem(page, api, '/problems/noupload');
    await pickScratch(page);
    await expect(dockOf(page).getByText('Ngôn ngữ này không nhận tệp tải lên.')).toBeVisible();
    await expect(dockOf(page).locator('input[type="file"]')).toHaveCount(0);
  });
});

test('a contest problem with no attempts left says so and cannot be submitted', async ({
  page,
  api,
}) => {
  api.routes['GET /problems/duongdi'] = {
    body: {
      data: problemDetail({ contest: { contestKey: 'r42', attemptsLeft: 0 } }),
    },
  };
  await openProblem(page, api);
  await expect(dockOf(page).getByText('Đã hết lượt nộp cho bài này.')).toBeVisible();
  await expect(submitButton(page)).toHaveAttribute('aria-disabled', 'true');
});
