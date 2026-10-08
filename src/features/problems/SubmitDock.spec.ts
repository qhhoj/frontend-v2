import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PY3_ID, SCRATCH_ID, problemDetail, sessionUser } from '@/test/fixtures';
import { fail, mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, problemPageRoutes, signedInViewer } from '@/test/problem-routes';

vi.mock('@/components/code-editor-cm', () => {
  throw new Error('no editor in jsdom');
});

const dockOf = (wrapper: VueWrapper) => wrapper.get('section[aria-label="Nộp bài"]');
const openProblem = async (path = '/problems/duongdi') => {
  const mounted = await mountApp(path);
  await vi.waitFor(() => expect(mounted.wrapper.find('#main h1').exists()).toBe(true));
  await flushPromises();
  return mounted;
};
const signedInRoutes = (detail = problemDetail()) => ({
  ...signedInViewer(),
  ...problemPageRoutes(detail),
});
const submitButton = (wrapper: VueWrapper) => dockOf(wrapper).get('button[type="submit"]');
const openLanguageList = async (wrapper: VueWrapper) => {
  await dockOf(wrapper).get('[data-pc-name="select"]').trigger('click');
  await flushPromises();
};
const pickLanguage = async (name: string) => {
  const options = [...document.body.querySelectorAll<HTMLElement>('[role="option"]')];
  const target = options.find((option) => option.textContent?.includes(name))!;
  target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); // PrimeVue selects on mousedown
  await flushPromises();
};

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

describe('anonymous viewer', () => {
  it('sees one sign-in row that returns to this problem, and no editor', async () => {
    mockApi({ ...anonymousViewer, ...problemPageRoutes() });
    const { wrapper } = await openProblem();
    const dock = dockOf(wrapper);
    const link = dock.get('a');
    expect(link.text()).toBe('Đăng nhập để nộp bài');
    expect(link.attributes('href')).toBe('/login?redirect=/problems/duongdi');
    expect(dock.find('textarea').exists()).toBe(false);
    expect(dock.find('button').exists()).toBe(false);
  });
});

describe('collapse', () => {
  it('toggles aria-expanded and keeps the language and submit reachable while collapsed', async () => {
    mockApi(signedInRoutes());
    const { wrapper } = await openProblem();
    const toggle = dockOf(wrapper).get('button[aria-controls]');
    expect(toggle.attributes('aria-expanded')).toBe('true');
    expect(wrapper.find(`#${toggle.attributes('aria-controls')}`).exists()).toBe(true);
    await toggle.trigger('click');
    expect(toggle.attributes('aria-expanded')).toBe('false');
    expect(dockOf(wrapper).get('textarea').isVisible()).toBe(false);
    expect(dockOf(wrapper).get('[data-pc-name="select"]').isVisible()).toBe(true);
    expect(submitButton(wrapper).isVisible()).toBe(true);
    await toggle.trigger('click');
    expect(dockOf(wrapper).get('textarea').isVisible()).toBe(true);
  });
  it('keeps what was typed through a collapse', async () => {
    mockApi(signedInRoutes());
    const { wrapper } = await openProblem();
    await dockOf(wrapper).get('textarea').setValue('my code');
    await dockOf(wrapper).get('button[aria-controls]').trigger('click');
    await dockOf(wrapper).get('button[aria-controls]').trigger('click');
    expect(dockOf(wrapper).get('textarea').element.value).toBe('my code');
  });
});

describe('language and template', () => {
  it('offers the file-only language with its marker and selects it', async () => {
    mockApi(signedInRoutes());
    const { wrapper } = await openProblem();
    await openLanguageList(wrapper);
    const scratch = [...document.body.querySelectorAll('[role="option"]')].find((option) =>
      option.textContent?.includes('Scratch 3'),
    );
    expect(scratch?.textContent).toContain('tải tệp');
    await pickLanguage('Scratch 3');
    expect(dockOf(wrapper).find('textarea').exists()).toBe(false);
    expect(dockOf(wrapper).get('input[type="file"]').attributes('accept')).toBe('.sb3');
    expect(submitButton(wrapper).text()).toBe('Nộp tệp');
  });
  it('shows "template restored" after a switch and drops it after typing', async () => {
    mockApi(signedInRoutes());
    const { wrapper } = await openProblem();
    await openLanguageList(wrapper);
    await pickLanguage('Python 3');
    expect(dockOf(wrapper).text()).toContain('Đã khôi phục mẫu');
    await dockOf(wrapper).get('textarea').setValue('print(1)');
    expect(dockOf(wrapper).text()).not.toContain('Đã khôi phục mẫu');
  });
  it('shows the per-language limits of the selected language', async () => {
    mockApi(signedInRoutes());
    const { wrapper } = await openProblem();
    expect(dockOf(wrapper).text()).not.toContain('3.0s');
    await openLanguageList(wrapper);
    await pickLanguage('Python 3');
    expect(dockOf(wrapper).text()).toContain('3.0s · 256MB');
  });
});

describe('source counter', () => {
  it('counts the code points and turns into an alert beyond the limit', async () => {
    mockApi(signedInRoutes());
    const { wrapper } = await openProblem();
    const area = dockOf(wrapper).get('textarea');
    await area.setValue('abc');
    expect(dockOf(wrapper).get('[data-testid="source-counter"]').text()).toBe('3 / 65536');
    expect(dockOf(wrapper).find('[role="alert"]').exists()).toBe(false);
    await area.setValue('x'.repeat(65_537));
    expect(dockOf(wrapper).get('[data-testid="source-counter"]').classes()).toContain(
      'text-negative',
    );
    expect(dockOf(wrapper).findAll('[role="alert"]')).toHaveLength(1);
    expect(dockOf(wrapper).get('[role="alert"]').text()).toBe('Vượt quá giới hạn 65536 ký tự');
    expect(submitButton(wrapper).attributes('aria-disabled')).toBe('true');
  });
});

describe('submitting', () => {
  it('opens the new submission', async () => {
    mockApi({ ...signedInRoutes(), 'POST /problems/duongdi/submit': ok({ id: 'sub-9' }) });
    const { wrapper, router } = await openProblem();
    const push = vi.spyOn(router, 'push').mockResolvedValue(undefined);
    await dockOf(wrapper).get('textarea').setValue('int main() {}');
    await submitButton(wrapper).trigger('click');
    await flushPromises();
    expect(push).toHaveBeenCalledWith({ name: 'submission', params: { id: 'sub-9' } });
  });
  it('shows the refusal under the editor and keeps the code', async () => {
    mockApi({
      ...signedInRoutes(),
      'POST /problems/duongdi/submit': fail(403, 'banned_from_problem'),
    });
    const { wrapper } = await openProblem();
    await dockOf(wrapper).get('textarea').setValue('keep me');
    await submitButton(wrapper).trigger('click');
    await flushPromises();
    expect(dockOf(wrapper).get('[role="alert"]').text()).toBe('Tài khoản bị cấm nộp bài này.');
    expect(dockOf(wrapper).get('textarea').element.value).toBe('keep me');
  });
  it('does not send an empty source', async () => {
    const calls = mockApi(signedInRoutes());
    const { wrapper } = await openProblem();
    await dockOf(wrapper).get('textarea').setValue('');
    await submitButton(wrapper).trigger('click');
    expect(calls.filter((call) => call.path.includes('/submit'))).toHaveLength(0);
  });
});

describe('contest problem', () => {
  it('shows the contest and the attempts left, or says none are left', async () => {
    mockApi(signedInRoutes(problemDetail({ contest: { contestKey: 'r42', attemptsLeft: 2 } })));
    const open = await openProblem();
    const line = dockOf(open.wrapper).get('[data-testid="submit-contest"]');
    expect(line.text()).toContain('Kỳ thi r42');
    expect(line.text()).toContain('Còn 2 lượt nộp');
    expect(line.get('a').attributes('href')).toBe('/contests/r42');
    open.wrapper.unmount();
    mockApi(signedInRoutes(problemDetail({ contest: { contestKey: 'r42', attemptsLeft: 0 } })));
    const spent = await openProblem();
    expect(dockOf(spent.wrapper).text()).toContain('Đã hết lượt nộp cho bài này.');
    await dockOf(spent.wrapper).get('textarea').setValue('x');
    expect(submitButton(spent.wrapper).attributes('aria-disabled')).toBe('true');
  });
  it('shows only the contest line when the contest has no cap', async () => {
    mockApi(signedInRoutes(problemDetail({ contest: { contestKey: 'r42', attemptsLeft: null } })));
    const { wrapper } = await openProblem();
    const text = dockOf(wrapper).get('[data-testid="submit-contest"]').text();
    expect(text).toBe('Kỳ thi r42');
  });
});

describe('?resubmit', () => {
  const earlier = {
    'GET /submissions/sub-1': ok({
      id: 'sub-1',
      language: { id: PY3_ID, key: 'PY3', name: 'Python 3' },
    }),
    'GET /submissions/sub-1/source': ok({ id: 'sub-1', source: 'print(7)\n' }),
  };
  it('prefills language and code once and removes the parameter', async () => {
    const calls = mockApi({ ...signedInRoutes(), ...earlier });
    const { wrapper, router } = await openProblem('/problems/duongdi?resubmit=sub-1');
    await vi.waitFor(() =>
      expect(dockOf(wrapper).get('textarea').element.value).toBe('print(7)\n'),
    );
    expect(dockOf(wrapper).text()).toContain('Python 3');
    expect(router.currentRoute.value.query.resubmit).toBeUndefined();
    expect(calls.filter((call) => call.path === '/submissions/sub-1/source')).toHaveLength(1);
  });
  it('says so when the submission cannot be read, leaving the editor with its template', async () => {
    mockApi({
      ...signedInRoutes(),
      'GET /submissions/sub-1': fail(403, 'forbidden'),
      'GET /submissions/sub-1/source': fail(403, 'forbidden'),
    });
    const { wrapper, router } = await openProblem('/problems/duongdi?resubmit=sub-1');
    await vi.waitFor(() =>
      expect(dockOf(wrapper).text()).toContain('Không lấy được bài nộp để nộp lại.'),
    );
    expect(dockOf(wrapper).get('textarea').element.value).toContain('int main');
    expect(router.currentRoute.value.query.resubmit).toBeUndefined();
  });
  it('is ignored for an anonymous viewer, who must not trigger a 401 fetch', async () => {
    const calls = mockApi({ ...anonymousViewer, ...problemPageRoutes() });
    await openProblem('/problems/duongdi?resubmit=sub-1');
    expect(calls.filter((call) => call.path.startsWith('/submissions'))).toHaveLength(0);
  });
});

describe('another problem', () => {
  it('starts fresh when the viewer leaves a problem and comes back to it', async () => {
    mockApi(signedInRoutes());
    const { wrapper, router, queryClient } = await openProblem();
    // A cached detail shows at once, so the page (and the dock) is not torn down by a loading state.
    queryClient.setQueryData(
      ['problems', 'detail', sessionUser().id, 'lis', 'vi'],
      problemDetail({ code: 'lis', name: 'Dãy con tăng dài nhất' }),
    );
    await openLanguageList(wrapper);
    await pickLanguage('Python 3');
    await dockOf(wrapper).get('textarea').setValue('my python');
    await router.push('/problems/lis');
    await vi.waitFor(() => expect(wrapper.get('#main h1').text()).toBe('Dãy con tăng dài nhất'));
    await router.push('/problems/duongdi');
    await vi.waitFor(() => expect(wrapper.get('#main h1').text()).toBe('Đường đi ngắn nhất'));
    await flushPromises();
    expect(dockOf(wrapper).get('textarea').element.value).toContain('int main');
    expect(dockOf(wrapper).text()).toContain('C++17');
  });
});

describe('--dock-height', () => {
  it('prefers the border box, which includes the border and the safe-area padding', async () => {
    let notify: ((entries: unknown[]) => void) | undefined;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: (entries: unknown[]) => void) {
          notify = callback;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    mockApi(signedInRoutes());
    await openProblem();
    notify!([{ borderBoxSize: [{ blockSize: 135 }], contentRect: { height: 120 } }]);
    expect(document.documentElement.style.getPropertyValue('--dock-height')).toBe('135px');
  });
  it('follows the dock size and is removed with the dock', async () => {
    let notify: ((entries: unknown[]) => void) | undefined;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: (entries: unknown[]) => void) {
          notify = callback;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    mockApi(signedInRoutes());
    const { wrapper } = await openProblem();
    notify!([{ contentRect: { height: 120 } }]);
    expect(document.documentElement.style.getPropertyValue('--dock-height')).toBe('120px');
    wrapper.unmount();
    expect(document.documentElement.style.getPropertyValue('--dock-height')).toBe('');
  });
});

describe('file-only language with uploads off', () => {
  it('shows the disabled state and no input', async () => {
    const closed = problemDetail();
    closed.allowedLanguages = [
      closed.allowedLanguages[0]!,
      { ...closed.allowedLanguages[2]!, id: SCRATCH_ID, fileSizeLimit: 0 },
    ];
    mockApi(signedInRoutes(closed));
    const { wrapper } = await openProblem();
    await openLanguageList(wrapper);
    await pickLanguage('Scratch 3');
    expect(dockOf(wrapper).text()).toContain('Ngôn ngữ này không nhận tệp tải lên.');
    expect(dockOf(wrapper).find('input[type="file"]').exists()).toBe(false);
    expect(submitButton(wrapper).attributes('aria-disabled')).toBe('true');
  });
});
