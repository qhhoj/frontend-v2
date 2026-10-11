import { defineComponent, ref } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CPP17_ID,
  PY3_ID,
  SCRATCH_ID,
  problemDetail,
  profile,
  languageItem,
} from '@/test/fixtures';
import { fail, invalid, issue, mockApi, ok } from '@/test/mock-api';
import type { ApiCall } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import type { Profile } from '@/api/types/profile';
import type { ProblemDetail } from '@/api/types/problems';
import { MAX_SOURCE_LENGTH } from '@/lib/source';
import { useSubmitForm } from './use-submit-form';

const { profileData } = await vi.hoisted(async () => {
  const { ref: createRef } = await import('vue');
  return { profileData: createRef<Profile | undefined>() };
});
vi.mock('@/features/account/profile.queries', () => ({
  useProfileQuery: () => ({ data: profileData }),
}));
/** The submit requests only: the router's own `/auth/me` is in `calls` too. */
const submitCalls = (calls: ApiCall[]) => calls.filter((call) => call.path.includes('/submit'));

function mountForm(problem: ProblemDetail = problemDetail(), resubmitId: string | null = null) {
  let form!: ReturnType<typeof useSubmitForm>;
  const problemRef = ref(problem);
  const wrapper = mountComponent(
    defineComponent({
      setup() {
        form = useSubmitForm(problemRef, ref(resubmitId));
        return () => null;
      },
    }),
  );
  const push = vi.spyOn(wrapper.vm.$router, 'push').mockResolvedValue(undefined);
  return { form, push, problemRef };
}
beforeEach(() => {
  profileData.value = undefined;
  mockApi({ ...anonymousViewer });
});

describe('language default and templates', () => {
  it('starts with the first text language, filled with its template, and never picks a file-only language', () => {
    const { form } = mountForm(
      problemDetail({
        allowedLanguages: [
          problemDetail().allowedLanguages[2]!,
          ...problemDetail().allowedLanguages.slice(0, 2),
        ],
      }),
    );
    expect(form.languageId.value).toBe(CPP17_ID);
    expect(form.source.value).toContain('int main');
    expect(form.templateRestored.value).toBe(false);
  });
  it('follows the account language when the profile arrives late, but a manual pick wins', async () => {
    const late = mountForm();
    profileData.value = profile({ languageId: PY3_ID });
    await flushPromises();
    expect(late.form.languageId.value).toBe(PY3_ID);
    expect(late.form.source.value).toBe('print()\n'); // the untouched template followed the language
    const picked = mountForm();
    picked.form.setLanguage(CPP17_ID);
    profileData.value = profile({ languageId: PY3_ID });
    await flushPromises();
    expect(picked.form.languageId.value).toBe(CPP17_ID);
  });
  it('ignores an account language the problem does not allow', async () => {
    profileData.value = profile({ languageId: 'not-allowed-here' });
    const { form } = mountForm();
    await flushPromises();
    expect(form.languageId.value).toBe(CPP17_ID);
  });
  it('swaps the template on a language switch only while the code is empty or still the old template', async () => {
    const { form } = mountForm();
    form.setLanguage(PY3_ID);
    await flushPromises();
    expect(form.source.value).toBe('print()\n');
    expect(form.templateRestored.value).toBe(true);
    form.source.value = 'print(input())\n';
    await flushPromises();
    expect(form.templateRestored.value).toBe(false);
    form.setLanguage(CPP17_ID);
    await flushPromises();
    expect(form.source.value).toBe('print(input())\n'); // the user's code is kept
  });
});

describe("late profile and the viewer's code", () => {
  it('never switches the language under code the viewer has typed', async () => {
    const { form } = mountForm();
    form.source.value = 'int x;';
    await flushPromises();
    profileData.value = profile({ languageId: PY3_ID });
    await flushPromises();
    expect(form.languageId.value).toBe(CPP17_ID);
    expect(form.source.value).toBe('int x;');
  });
});

describe('a problem change under the form', () => {
  it('falls back to the default language and its template when the pick is not allowed any more, and never posts it', async () => {
    const calls = mockApi({
      ...anonymousViewer,
      'POST /problems/duongdi/submit': ok({ id: 'sub-9' }),
    });
    const { form, problemRef } = mountForm();
    form.setLanguage(PY3_ID);
    await flushPromises();
    problemRef.value = problemDetail({ allowedLanguages: [problemDetail().allowedLanguages[0]!] });
    await flushPromises();
    expect(form.languageId.value).toBe(CPP17_ID);
    await form.submitNow();
    expect(submitCalls(calls)[0]!.body).toMatchObject({ language: CPP17_ID });
  });
});

describe('source limit', () => {
  it('accepts exactly 65 536 code points of emoji and blocks 65 537 before any request', () => {
    const calls = mockApi({ ...anonymousViewer });
    const { form } = mountForm();
    form.source.value = '😀'.repeat(MAX_SOURCE_LENGTH);
    expect(form.length.value).toBe(MAX_SOURCE_LENGTH);
    expect(form.canSubmit.value).toBe(true);
    form.source.value += 'x';
    expect(form.tooLong.value).toBe(true);
    expect(form.canSubmit.value).toBe(false);
    void form.submitNow();
    expect(submitCalls(calls)).toHaveLength(0);
  });
});

describe('loading a source file into the editor', () => {
  it('shows why a file was refused and leaves the code alone', async () => {
    const { form } = mountForm();
    form.source.value = 'mine';
    await form.loadFile(new File(['a\u0000b'], 'a.bin'));
    expect(form.errorText.value).toBe('Tệp này không phải văn bản.');
    expect(form.source.value).toBe('mine');
    await form.loadFile(new File(['x'.repeat(MAX_SOURCE_LENGTH + 1)], 'long.cpp'));
    expect(form.errorText.value).toContain('vượt quá');
    expect(form.source.value).toBe('mine');
  });
});

describe('submitting text', () => {
  it('posts the language id and the source, then opens the submission', async () => {
    const calls = mockApi({
      ...anonymousViewer,
      'POST /problems/duongdi/submit': ok({ id: 'sub-9' }),
    });
    const { form, push } = mountForm();
    form.source.value = 'int main() { return 0; }';
    await form.submitNow();
    expect(submitCalls(calls)[0]!.body).toEqual({
      language: CPP17_ID,
      source: 'int main() { return 0; }',
    });
    expect(push).toHaveBeenCalledWith({ name: 'submission', params: { id: 'sub-9' } });
  });
  it('sends one request for a double click', async () => {
    const calls = mockApi({
      ...anonymousViewer,
      'POST /problems/duongdi/submit': ok({ id: 'sub-9' }),
    });
    const { form } = mountForm();
    form.source.value = 'x';
    void form.submitNow();
    await form.submitNow();
    expect(submitCalls(calls)).toHaveLength(1);
  });
  it('keeps the code and shows the message of each refusal the backend can send', async () => {
    mockApi({
      ...anonymousViewer,
      'POST /problems/duongdi/submit': fail(403, 'banned_from_problem'),
    });
    const banned = mountForm();
    banned.form.source.value = 'x';
    await banned.form.submitNow();
    expect(banned.form.errorText.value).toBe('Tài khoản bị cấm nộp bài này.');
    expect(banned.form.source.value).toBe('x');
    mockApi({
      ...anonymousViewer,
      'POST /problems/duongdi/submit': invalid(issue('language', 'invalid', 'English')),
    });
    const wrong = mountForm();
    wrong.form.source.value = 'x';
    await wrong.form.submitNow();
    expect(wrong.form.errorText.value).toContain('không được phép');
  });
});

describe('file-only languages', () => {
  const scratch = () => mountForm(problemDetail());
  const catFile = (name = 'catmaze-final.sb3', size = 1000) =>
    new File([new Uint8Array(size)], name);
  it('refuses a wrong extension and an oversize file with the right text and keeps the earlier file', () => {
    const { form } = scratch();
    form.setLanguage(SCRATCH_ID);
    form.chooseFile(catFile());
    form.chooseFile(catFile('cat.zip'));
    expect(form.chosenFile.value?.name).toBe('catmaze-final.sb3');
    expect(form.errorText.value).toBe('Tệp phải có đuôi .sb3.');
    form.chooseFile(catFile('big.sb3', 6 * 1024 * 1024));
    expect(form.errorText.value).toContain('lớn');
  });
  it('posts multipart with the language id and file and never JSON', async () => {
    const calls = mockApi({
      ...anonymousViewer,
      'POST /problems/duongdi/submit/file': ok({ id: 'sub-9' }),
    });
    const { form, push } = scratch();
    form.setLanguage(SCRATCH_ID);
    expect(form.canSubmit.value).toBe(false);
    form.chooseFile(catFile());
    expect(form.canSubmit.value).toBe(true);
    await form.submitNow();
    const body = submitCalls(calls)[0]!.body as FormData;
    expect(body.get('language')).toBe(SCRATCH_ID);
    expect((body.get('file') as File).name).toBe('catmaze-final.sb3');
    expect(push).toHaveBeenCalledWith({ name: 'submission', params: { id: 'sub-9' } });
  });
  it('offers no upload at all when the language has fileSizeLimit 0', () => {
    const closed = problemDetail({
      allowedLanguages: [
        languageItem(SCRATCH_ID, 'SCRATCH', 'Scratch 3', {
          fileOnly: true,
          extension: 'sb3',
          fileSizeLimit: 0,
        }),
      ],
    });
    const { form } = mountForm(closed);
    form.setLanguage(SCRATCH_ID);
    form.chooseFile(catFile());
    expect(form.uploadsOff.value).toBe(true);
    expect(form.chosenFile.value).toBeNull();
    expect(form.canSubmit.value).toBe(false);
  });
});

describe('file mode requests and messages', () => {
  const catFile = () => new File([new Uint8Array(10)], 'cat.sb3');
  it('keeps the chosen file after a server refusal and shows why', async () => {
    mockApi({
      ...anonymousViewer,
      'POST /problems/duongdi/submit/file': invalid(issue('file', 'scratch_project_invalid', 'x')),
    });
    const { form } = mountForm();
    form.setLanguage(SCRATCH_ID);
    form.chooseFile(catFile());
    await form.submitNow();
    expect(form.chosenFile.value?.name).toBe('cat.sb3');
    expect(form.errorText.value).toBe('Đây không phải dự án Scratch hợp lệ.');
  });
});

describe('contest attempts (B19)', () => {
  it('blocks submit at 0 attempts left and says so, and allows it with attempts left or no cap', () => {
    const spent = mountForm(problemDetail({ contest: { contestKey: 'r42', attemptsLeft: 0 } }));
    spent.form.source.value = 'x';
    expect(spent.form.canSubmit.value).toBe(false);
    const open = mountForm(problemDetail({ contest: { contestKey: 'r42', attemptsLeft: 2 } }));
    open.form.source.value = 'x';
    expect(open.form.canSubmit.value).toBe(true);
    const uncapped = mountForm(
      problemDetail({ contest: { contestKey: 'r42', attemptsLeft: null } }),
    );
    uncapped.form.source.value = 'x';
    expect(uncapped.form.canSubmit.value).toBe(true);
  });
});

describe('resubmit prefill', () => {
  const resubmitRoutes = (languageId: string) => ({
    ...anonymousViewer,
    'GET /submissions/sub-1': ok({
      id: 'sub-1',
      language: { id: languageId, key: 'x', name: 'x' },
    }),
    'GET /submissions/sub-1/source': ok({ id: 'sub-1', source: 'print(42)\n' }),
  });
  it('puts the old code and language in the editor', async () => {
    mockApi(resubmitRoutes(PY3_ID));
    const { form } = mountForm(problemDetail(), 'sub-1');
    await vi.waitFor(() => expect(form.source.value).toBe('print(42)\n'));
    await flushPromises();
    expect(form.languageId.value).toBe(PY3_ID);
    expect(form.source.value).toBe('print(42)\n'); // not replaced by Python's template
  });
  it('keeps the default language when the old one is no longer allowed, and still shows the code', async () => {
    mockApi(resubmitRoutes('0192a000-0000-7000-8000-0000000000aa'));
    const { form } = mountForm(problemDetail(), 'sub-1');
    await vi.waitFor(() => expect(form.source.value).toBe('print(42)\n'));
    expect(form.languageId.value).toBe(CPP17_ID);
  });
  it('says so when the submission cannot be read and leaves the editor as it was', async () => {
    mockApi({
      ...anonymousViewer,
      'GET /submissions/sub-1': fail(403, 'forbidden'),
      'GET /submissions/sub-1/source': fail(403, 'forbidden'),
    });
    const { form } = mountForm(problemDetail(), 'sub-1');
    await vi.waitFor(() => expect(form.resubmitUnavailable.value).toBe(true));
    expect(form.source.value).toContain('int main');
  });
});
