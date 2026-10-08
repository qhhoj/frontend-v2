import type { Page } from '@playwright/test';
import type { SecondFactorMethod } from '../src/api/types/auth';
import { THEMES } from '../src/theme/registry';
import { expect, test } from './fixtures/api';
import { AUDIT_VIEWPORTS, applyTheme, axeViolationsIn } from './fixtures/audit';
import { installAuth } from './fixtures/auth';
import type { AuthPhase } from './fixtures/auth';

/** `ready` is text that only shows once the page has left its loading state, so axe never audits half a page. */
interface Screen {
  name: string;
  path: string;
  phase: AuthPhase;
  ready: string;
  methods?: SecondFactorMethod[];
}
const SCREENS: Screen[] = [
  { name: 'login', path: '/login', phase: 'anonymous', ready: 'GitHub' },
  {
    name: 'login with messages',
    path: '/login?error=oauth_failed&notice=password-reset',
    phase: 'anonymous',
    ready: 'Mật khẩu đã được đổi, hãy đăng nhập lại.',
  },
  { name: 'register', path: '/register', phase: 'anonymous', ready: 'Trường' },
  {
    name: 'forgot password',
    path: '/forgot-password',
    phase: 'anonymous',
    ready: 'Quên mật khẩu?',
  },
  {
    name: 'reset password',
    path: '/reset-password/tok-1',
    phase: 'anonymous',
    ready: 'Đặt mật khẩu mới',
  },
  { name: 'resend activation', path: '/activate', phase: 'anonymous', ready: 'Gửi lại liên kết' },
  {
    name: 'activation',
    path: '/activate/done',
    phase: 'anonymous',
    ready: 'Tài khoản đã kích hoạt',
  },
  {
    name: 'social signup',
    path: '/register/social?token=pending-1',
    phase: 'anonymous',
    ready: 'Hoàn tất đăng ký',
  },
  { name: 'second factor', path: '/login/2fa', phase: 'partial', ready: 'Xác thực hai bước' },
  // Playwright's Chromium parses WebAuthn JSON, so a key-only account sees the key card; the unsupported card is unit-tested.
  {
    name: 'second factor, key only',
    path: '/login/2fa',
    phase: 'partial',
    methods: ['webauthn'],
    ready: 'Chạm vào khoá bảo mật',
  },
  {
    name: 'second factor, session changed',
    path: '/login/2fa',
    phase: 'partial',
    methods: [],
    ready: 'Đăng nhập lại',
  },
  {
    name: 'forced password change',
    path: '/account/password',
    phase: 'forced',
    ready: 'Mật khẩu hiện tại',
  },
];

async function openScreen(page: Page, screen: Screen) {
  await page.goto(screen.path);
  await expect(page.getByText(screen.ready, { exact: false }).first()).toBeVisible();
  await page.waitForLoadState('networkidle');
}

for (const viewport of AUDIT_VIEWPORTS)
  for (const theme of THEMES)
    for (const screen of SCREENS)
      test(`${screen.name} has no WCAG 2.1 A/AA violations in ${theme.id}, ${viewport.name}`, async ({
        page,
        api,
      }) => {
        installAuth(api, { phase: screen.phase, methods: screen.methods });
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await applyTheme(page, api, theme);
        await openScreen(page, screen);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
        expect(await axeViolationsIn(page)).toEqual([]);
      });

for (const viewport of AUDIT_VIEWPORTS)
  test.describe(viewport.name, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const screen of SCREENS)
      test(`${screen.name} fits the width and every control is a touch target`, async ({
        page,
        api,
      }) => {
        installAuth(api, { phase: screen.phase, methods: screen.methods });
        await openScreen(page, screen);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          viewport.width,
        );
        const tooSmall = await page.evaluate(() =>
          [
            ...document.querySelectorAll<HTMLElement>(
              'main button, main a[href^="/api/"], main [role="combobox"]',
            ),
          ]
            .filter(
              (element) =>
                element.offsetParent !== null && element.getBoundingClientRect().height < 44,
            )
            .filter((element) => element.closest('p') === null) // inline links in a sentence: WCAG 2.5.8 exception
            .map(
              (element) =>
                element.textContent?.trim() ||
                element.getAttribute('aria-label') ||
                element.getAttribute('name'),
            ),
        );
        expect(tooSmall).toEqual([]);
      });
  });

test.describe('login layout', () => {
  const [desktop, phone] = AUDIT_VIEWPORTS;

  test(`${desktop.name}: the brand panel is beside the form and shows the counts`, async ({
    page,
    api,
  }) => {
    installAuth(api);
    await page.setViewportSize({ width: desktop.width, height: desktop.height });
    await page.goto('/login');
    const headline = await page.getByText('Luyện thuật toán mỗi ngày, cùng Bit.').boundingBox();
    const title = await page.getByRole('heading', { name: 'Đăng nhập' }).boundingBox();
    expect(headline!.x + headline!.width).toBeLessThanOrEqual(title!.x);
    await expect(page.getByTestId('site-counts')).toHaveText('412 bài · 1.284 thành viên');
  });

  test(`${phone.name}: the band sits above the form, the headline is hidden, the form starts in the first screenful`, async ({
    page,
    api,
  }) => {
    installAuth(api);
    await page.setViewportSize({ width: phone.width, height: phone.height });
    await page.goto('/login');
    const counts = await page.getByTestId('site-counts').boundingBox();
    const title = await page.getByRole('heading', { name: 'Đăng nhập' }).boundingBox();
    expect(counts!.y + counts!.height).toBeLessThanOrEqual(title!.y);
    expect(title!.y).toBeLessThan(phone.height);
    await expect(page.getByText('Luyện thuật toán mỗi ngày, cùng Bit.')).toBeHidden();
  });
});
