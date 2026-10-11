import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import type { Component, PropType } from 'vue';
import { fail, mockApi, ok, rateLimited } from '@/test/mock-api';
import { anonymousViewer } from '@/test/problem-routes';
import { mountComponent } from '@/test/mount';
import AdminField from './AdminField.vue';
import AdminSwitch from './AdminSwitch.vue';
import ExactChips from './ExactChips.vue';
import ExactLookup from './ExactLookup.vue';
import MarkdownField from './MarkdownField.vue';
import UploadButton from './UploadButton.vue';
import UsernameChips from './UsernameChips.vue';
import { PREVIEW_DELAY_MS } from './use-render-preview';
import { SUGGEST_DELAY_MS } from './use-chip-suggestions';
import { translate } from '@/i18n';

describe('AdminSwitch', () => {
  it('says why it is locked and never flips while locked', async () => {
    const wrapper = mountComponent(AdminSwitch, {
      props: {
        modelValue: false,
        label: 'Công khai',
        lockedBy: 'judge.change_public_visibility',
      },
    });
    expect(wrapper.get('[role="switch"]').attributes('aria-disabled')).toBe('true');
    await wrapper.get('[role="switch"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.text()).toContain('Cần quyền judge.change_public_visibility');
  });
});

const ID_A = '0192c5a1-7e2f-7a31-9b4c-0e6d1f4a9c21';

/** Keeps the chips in a ref, as a page would, so the picks show up in the list. */
const ChipsHost = defineComponent({
  props: {
    component: { type: Object as PropType<Component>, required: true },
    initial: { type: Array as PropType<{ id: string }[]>, required: true },
  },
  setup(props) {
    const chips = ref([...props.initial]);
    return () =>
      h('div', [
        h(props.component, {
          modelValue: chips.value,
          label: 'Danh sách',
          'onUpdate:modelValue': (value: { id: string }[]) => (chips.value = value),
        }),
        h('output', JSON.stringify(chips.value)),
      ]);
  },
});

describe('UsernameChips', () => {
  it('shows an unnamed id short, adds an exact username as its id, and refuses an unknown one', async () => {
    mockApi({
      ...anonymousViewer,
      'GET /users/thayhung': ok({
        id: '0192a000-0000-7000-8000-0000000000aa',
        username: 'thayhung',
        displayName: 'x',
      }),
      'GET /users/nobody': fail(404, 'not_found'),
    });
    const wrapper = mountComponent(ChipsHost, {
      props: { component: UsernameChips, initial: [{ id: ID_A, username: null }] },
    });
    expect(wrapper.text()).toContain('0192…9c21');
    await wrapper.get('input').setValue('thayhung');
    await wrapper.get('input').trigger('keydown', { key: 'Enter' });
    await flushPromises();
    expect(wrapper.get('output').text()).toContain('"username":"thayhung"');
    await wrapper.get('input').setValue('nobody');
    await wrapper.get('input').trigger('keydown', { key: 'Enter' });
    await flushPromises();
    expect(wrapper.text()).toContain('Không có tài khoản "nobody".');
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true');
  });

  it('shows the wait for a 429 instead of saying the account is missing', async () => {
    mockApi({ ...anonymousViewer, 'GET /users/busy': rateLimited(42) });
    const wrapper = mountComponent(ChipsHost, {
      props: { component: UsernameChips, initial: [{ id: ID_A, username: null }] },
    });
    await wrapper.get('input').setValue('busy');
    await wrapper.get('input').trigger('keydown', { key: 'Enter' });
    await flushPromises();
    expect(wrapper.text()).toContain('Thử lại sau 42 giây.');
    expect(wrapper.text()).not.toContain('Không có tài khoản');
  });

  it('shows a network failure as a failure, not as a missing account', async () => {
    mockApi({ ...anonymousViewer });
    const answer = globalThis.fetch;
    vi.stubGlobal('fetch', (input: string, init: RequestInit) =>
      input.includes('/users/') ? Promise.reject(new TypeError('offline')) : answer(input, init),
    );
    const wrapper = mountComponent(ChipsHost, {
      props: { component: UsernameChips, initial: [{ id: ID_A, username: null }] },
    });
    await wrapper.get('input').setValue('thayhung');
    await wrapper.get('input').trigger('keydown', { key: 'Enter' });
    await flushPromises();
    expect(wrapper.text()).toContain('Không kết nối được máy chủ.');
    expect(wrapper.text()).not.toContain('Không có tài khoản');
  });

  it('removes a chip with its button and never adds the same user twice', async () => {
    mockApi({ ...anonymousViewer, 'GET /users/a': ok({ id: 'id-a', username: 'a' }) });
    const wrapper = mountComponent(ChipsHost, {
      props: { component: UsernameChips, initial: [{ id: ID_A, username: null }] },
    });
    for (let index = 0; index < 2; index += 1) {
      await wrapper.get('input').setValue('a');
      await wrapper.get('input').trigger('keydown', { key: 'Enter' });
      await flushPromises();
    }
    expect(wrapper.findAll('[data-testid="user-chip"]')).toHaveLength(2);
    await wrapper.get('button[aria-label="Bỏ 0192…9c21"]').trigger('click');
    expect(wrapper.findAll('[data-testid="user-chip"]')).toHaveLength(1);
  });

  it('shows a locked list read-only and says which permission it needs', () => {
    mockApi({ ...anonymousViewer });
    const wrapper = mountComponent(UsernameChips, {
      props: {
        modelValue: [{ id: 'id-a', username: 'a' }],
        label: 'Tác giả',
        lockedBy: 'judge.edit_all_problem',
      },
    });
    expect(wrapper.get('input').attributes('disabled')).toBeDefined();
    expect(wrapper.find('button').exists()).toBe(false);
    expect(wrapper.text()).toContain('Cần quyền judge.edit_all_problem');
  });
});

describe('UsernameChips suggestions', () => {
  afterEach(() => vi.useRealTimers());
  const typeAndWait = async (wrapper: ReturnType<typeof mountComponent>, text: string) => {
    await wrapper.get('input').setValue(text);
    await vi.advanceTimersByTimeAsync(SUGGEST_DELAY_MS);
    await flushPromises();
  };
  const optionNames = (wrapper: ReturnType<typeof mountComponent>) =>
    wrapper.findAll('[role="option"]').map((option) => option.text());

  it('offers users by prefix after a pause, leaves out picked ones, and picks with the keyboard', async () => {
    vi.useFakeTimers();
    const calls = mockApi({
      ...anonymousViewer,
      'GET /user-suggestions': ok([
        { id: ID_A, username: 'thayhung' },
        { id: 'id-b', username: 'thaylam' },
        { id: 'id-c', username: 'thaytu' },
      ]),
    });
    const wrapper = mountComponent(ChipsHost, {
      props: { component: UsernameChips, initial: [{ id: ID_A, username: null }] },
    });
    await wrapper.get('input').setValue('th');
    await wrapper.get('input').setValue('thay');
    expect(calls.filter((call) => call.path.endsWith('/user-suggestions'))).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(SUGGEST_DELAY_MS);
    await flushPromises();
    const asked = calls.filter((call) => call.path.endsWith('/user-suggestions'));
    expect(asked.map((call) => call.query.get('prefix'))).toEqual(['thay']);
    expect(optionNames(wrapper)).toEqual(['thaylam', 'thaytu']);
    expect(wrapper.get('input').attributes('aria-expanded')).toBe('true');

    await wrapper.get('input').trigger('keydown', { key: 'ArrowUp' });
    await wrapper.get('input').trigger('keydown', { key: 'Enter' });
    expect(wrapper.get('output').text()).toContain('"username":"thaytu"');
    expect(wrapper.find('[role="option"]').exists()).toBe(false);
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('');
  });

  it('sends nothing for text that cannot start a username', async () => {
    vi.useFakeTimers();
    const calls = mockApi({ ...anonymousViewer });
    const wrapper = mountComponent(ChipsHost, {
      props: { component: UsernameChips, initial: [] },
    });
    await typeAndWait(wrapper, 'a.b');
    expect(calls.filter((call) => call.path.endsWith('/user-suggestions'))).toHaveLength(0);
  });

  it('shows nothing when suggestions fail, and Enter still adds the exact username', async () => {
    vi.useFakeTimers();
    mockApi({
      ...anonymousViewer,
      'GET /user-suggestions': rateLimited(30),
      'GET /users/thayhung': ok({ id: 'id-h', username: 'thayhung' }),
    });
    const wrapper = mountComponent(ChipsHost, {
      props: { component: UsernameChips, initial: [] },
    });
    await typeAndWait(wrapper, 'thayhung');
    expect(wrapper.find('[role="option"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('30');
    await wrapper.get('input').trigger('keydown', { key: 'Enter' });
    await flushPromises();
    expect(wrapper.get('output').text()).toContain('"username":"thayhung"');
  });
});

describe('ExactChips suggestions', () => {
  afterEach(() => vi.useRealTimers());

  it('shows only the answer for the newest text when answers arrive out of order', async () => {
    vi.useFakeTimers();
    mockApi({ ...anonymousViewer });
    const pending = new Map<string, (chips: { id: string }[]) => void>();
    const suggest = (typed: string) =>
      new Promise<{ id: string }[]>((resolve) => pending.set(typed, resolve));
    const wrapper = mountComponent(ExactChips, {
      props: {
        modelValue: [],
        label: 'Danh sách',
        lookup: () => Promise.reject(new Error('unused')),
        suggest,
        nameOf: (chip: { id: string }) => chip.id,
        isNamed: () => true,
        placeholder: '',
        noSuchText: () => '',
        chipTestId: 'chip',
      },
    });
    await wrapper.get('input').setValue('a');
    await vi.advanceTimersByTimeAsync(SUGGEST_DELAY_MS);
    await wrapper.get('input').setValue('ab');
    await vi.advanceTimersByTimeAsync(SUGGEST_DELAY_MS);
    pending.get('ab')!([{ id: 'newest' }]);
    await flushPromises();
    pending.get('a')!([{ id: 'stale' }]);
    await flushPromises();
    expect(wrapper.findAll('[role="option"]').map((option) => option.text())).toEqual(['newest']);
  });
});

describe('AdminField', () => {
  const withInput = {
    default:
      '<template #default="slotProps"><input :id="slotProps.id" :aria-describedby="slotProps.describedBy" :aria-invalid="slotProps.invalid" /></template>',
  };

  it('ties the label, the input, the error and the hint together', () => {
    const wrapper = mountComponent(AdminField, {
      props: {
        label: 'Tên bài',
        hint: 'Tối đa 100 ký tự',
        error: 'Không được để trống.',
        inputId: 'problem-name',
      },
      slots: withInput,
    });
    const input = wrapper.get('input');
    expect(wrapper.get('label').attributes('for')).toBe('problem-name');
    expect(input.attributes('id')).toBe('problem-name');
    expect(input.attributes('aria-invalid')).toBe('true');
    const describedBy = input.attributes('aria-describedby')!.split(' ');
    expect(describedBy.map((id) => wrapper.get(`#${id}`).text())).toEqual([
      'Không được để trống.',
      'Tối đa 100 ký tự',
    ]);
  });

  it('marks nothing invalid and describes nothing when there is no error and no hint', () => {
    const wrapper = mountComponent(AdminField, {
      props: { label: 'Nguồn' },
      slots: withInput,
    });
    expect(wrapper.get('input').attributes('aria-invalid')).toBeUndefined();
    expect(wrapper.get('input').attributes('aria-describedby')).toBeUndefined();
  });
});

describe('MarkdownField', () => {
  afterEach(() => vi.useRealTimers());

  it('previews the text after the typing pause through the sanitised endpoint', async () => {
    vi.useFakeTimers();
    const calls = mockApi({
      ...anonymousViewer,
      'POST /problems/render-preview': () => ok({ html: '<p>Xin chào bạn</p>' }),
    });
    const wrapper = mountComponent(MarkdownField, {
      props: { modelValue: 'Xin chào', label: 'Đề bài', previewStyle: 'problem' },
    });
    await vi.advanceTimersByTimeAsync(PREVIEW_DELAY_MS);
    await flushPromises();
    expect(calls.filter((call) => call.method === 'POST').map((call) => call.body)).toEqual([
      { style: 'problem', markdown: 'Xin chào' },
    ]);
    expect(wrapper.get('section').text()).toContain('Xin chào bạn');
  });
});

describe('ExactLookup', () => {
  it('opens the trimmed value on submit and ignores an empty box', async () => {
    const wrapper = mountComponent(ExactLookup, {
      props: { label: 'Mã bài', submitLabel: 'Mở' },
    });
    await wrapper.get('form').trigger('submit');
    expect(wrapper.emitted('open')).toBeUndefined();
    await wrapper.get('input').setValue('  aplusb ');
    await wrapper.get('form').trigger('submit');
    expect(wrapper.emitted('open')).toEqual([['aplusb']]);
    expect(wrapper.get('label').attributes('for')).toBe(wrapper.get('input').attributes('id'));
  });
});

describe('UploadButton', () => {
  const pickFile = async (wrapper: ReturnType<typeof mountComponent>, file: File) => {
    const input = wrapper.get('input[type="file"]');
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true });
    await input.trigger('change');
  };

  it('emits a file within the limit and nothing else', async () => {
    const wrapper = mountComponent(UploadButton, {
      props: { label: 'Tải lên', maxBytes: 10 },
    });
    const file = new File([new Uint8Array(10)], 'a.pdf');
    await pickFile(wrapper, file);
    expect(wrapper.emitted('picked')).toEqual([[file]]);
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it('refuses a file over the limit with the limit in the text, and emits nothing', async () => {
    const wrapper = mountComponent(UploadButton, {
      props: { label: 'Tải lên', maxBytes: 5 * 1024 * 1024 },
    });
    await pickFile(wrapper, new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.pdf'));
    expect(wrapper.emitted('picked')).toBeUndefined();
    expect(wrapper.get('[role="alert"]').text()).toBe('Tệp quá lớn (tối đa 5.0 MB).');
    expect(wrapper.get('input').attributes('aria-describedby')).toBe(
      wrapper.get('[role="alert"]').attributes('id'),
    );
  });

  it('disables the picker while an upload runs, and a pick that still arrives is said, not dropped', async () => {
    const wrapper = mountComponent(UploadButton, {
      props: { label: 'Tải lên', isPending: true },
    });
    const input = wrapper.get('input[type="file"]');
    expect(input.attributes('disabled')).toBeDefined();
    expect(wrapper.get('label').text()).toBe('Đang tải lên…');
    Object.defineProperty(input.element, 'files', {
      value: [new File(['x'], 'a.pdf')],
      configurable: true,
    });
    input.element.dispatchEvent(new Event('change'));
    await flushPromises();
    expect(wrapper.emitted('picked')).toBeUndefined();
    expect(wrapper.get('[role="status"]').text()).toBe(
      'Đang tải lên. Hãy chọn lại tệp sau khi xong.',
    );
  });
});

describe('preview failure and the reasons a control is off', () => {
  it('shows a preview failure in words, not as a stale or blank preview', async () => {
    vi.useFakeTimers();
    mockApi({ ...anonymousViewer, 'POST /problems/render-preview': fail(403, 'forbidden') });
    const wrapper = mountComponent(MarkdownField, {
      props: { modelValue: 'Xin chào', label: 'Đề bài', previewStyle: 'problem' },
    });
    await vi.advanceTimersByTimeAsync(PREVIEW_DELAY_MS);
    await flushPromises();
    expect(wrapper.get('section').text()).toContain(translate('errors.forbidden'));
    vi.useRealTimers();
  });

  it('says why a full chip list is closed, and ties that reason to the input', () => {
    mockApi({ ...anonymousViewer });
    const wrapper = mountComponent(UsernameChips, {
      props: { modelValue: [{ id: ID_A, username: 'a' }], label: 'Người duyệt', max: 1 },
    });
    expect(wrapper.get('input').attributes('disabled')).toBeDefined();
    const describedBy = wrapper.get('input').attributes('aria-describedby')!;
    expect(wrapper.get(`#${describedBy}`).text()).toBe('Đã đủ 1 mục.');
  });
});
