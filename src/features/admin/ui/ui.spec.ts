import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import type { Component, PropType } from 'vue';
import { fail, mockApi, ok } from '@/test/mock-api';
import { anonymousViewer } from '@/test/problem-routes';
import { mountComponent } from '@/test/mount';
import { staffViewer, switchNamed } from '@/test/admin-routes';
import AdminField from './AdminField.vue';
import AdminPageHeader from './AdminPageHeader.vue';
import AdminStatus from './AdminStatus.vue';
import AdminSwitch from './AdminSwitch.vue';
import AdminTabs from './AdminTabs.vue';
import AdminUserLabel from './AdminUserLabel.vue';
import ExactLookup from './ExactLookup.vue';
import MarkdownField from './MarkdownField.vue';
import OrganizationChips from './OrganizationChips.vue';
import UploadButton from './UploadButton.vue';
import UsernameChips from './UsernameChips.vue';
import { PREVIEW_DELAY_MS } from './use-render-preview';

describe('AdminSwitch', () => {
  it('is a switch that flips its model', async () => {
    const wrapper = mountComponent(AdminSwitch, {
      props: { modelValue: false, label: 'Công khai' },
    });
    await wrapper.get('[role="switch"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]]);
  });

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

  it('is found by its visible label through the shared test helper, which throws for an unknown label', () => {
    const wrapper = mountComponent(AdminSwitch, {
      props: { modelValue: true, label: 'Công khai' },
    });
    expect(switchNamed(wrapper, 'Công khai').attributes('aria-checked')).toBe('true');
    expect(() => switchNamed(wrapper, 'Riêng tư')).toThrow('No switch "Riêng tư"');
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

describe('AdminPageHeader', () => {
  it('links every crumb but the last, and shows the title, the lead and the actions', () => {
    const wrapper = mountComponent(AdminPageHeader, {
      props: {
        crumbs: [{ label: 'Bài tập', to: { name: 'admin-problems' } }, { label: 'aplusb' }],
        title: 'Sửa bài',
        lead: 'Thông tin chung của bài.',
      },
      slots: { actions: '<button type="button">Nhân bản</button>' },
    });
    expect(wrapper.get('nav').attributes('aria-label')).toBe('Đường dẫn');
    expect(wrapper.findAll('nav a').map((link) => link.text())).toEqual(['Bài tập']);
    expect(wrapper.get('nav').text()).toContain('aplusb');
    expect(wrapper.get('h1').text()).toBe('Sửa bài');
    expect(wrapper.text()).toContain('Thông tin chung của bài.');
    expect(wrapper.text()).toContain('Nhân bản');
  });
});

describe('AdminTabs', () => {
  it('links each tab with the route params and marks only the open one as the current page', async () => {
    mockApi(staffViewer(['judge.edit_own_problem']));
    const wrapper = mountComponent(AdminTabs, {
      props: {
        label: 'Các phần của bài',
        params: { code: 'aplusb' },
        tabs: [
          { routeName: 'admin-problemGeneral', labelKey: 'admin.shell.screens.problemGeneral' },
          { routeName: 'admin-problemData', labelKey: 'admin.shell.screens.problemData' },
        ],
      },
    });
    await wrapper.vm.$router.push({ name: 'admin-problemData', params: { code: 'aplusb' } });
    await flushPromises();
    expect(wrapper.findAll('a').map((link) => link.attributes('href'))).toEqual([
      '/admin/problems/aplusb/general',
      '/admin/problems/aplusb/data',
    ]);
    expect(wrapper.findAll('a[aria-current="page"]').map((link) => link.text())).toEqual([
      'Sửa bài: dữ liệu chấm',
    ]);
    expect(wrapper.get('nav').attributes('aria-label')).toBe('Các phần của bài');
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

  it('emits what is typed and links its error to the textarea', async () => {
    vi.useFakeTimers();
    mockApi({ ...anonymousViewer, 'POST /problems/render-preview': () => ok({ html: '' }) });
    const wrapper = mountComponent(MarkdownField, {
      props: { modelValue: '', label: 'Đề bài', previewStyle: 'problem', error: 'Quá dài.' },
    });
    await wrapper.get('textarea').setValue('abc');
    expect(wrapper.emitted('update:modelValue')).toEqual([['abc']]);
    const describedBy = wrapper.get('textarea').attributes('aria-describedby')!;
    expect(wrapper.get(`#${describedBy}`).text()).toBe('Quá dài.');
    expect(wrapper.get('textarea').attributes('aria-invalid')).toBe('true');
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

describe('AdminStatus', () => {
  it.each([
    ['done', 'status'],
    ['queued', 'status'],
    ['security', 'status'],
    ['refused', 'alert'],
  ] as const)('announces a %s line with the role %s', (kind, role) => {
    const wrapper = mountComponent(AdminStatus, {
      props: { kind, text: 'Đã xếp vào hàng đợi.' },
    });
    expect(wrapper.get(`[role="${role}"]`).text()).toContain('Đã xếp vào hàng đợi.');
    expect(wrapper.find('[data-testid="inline-bit"]').exists()).toBe(true);
  });
});

describe('AdminUserLabel', () => {
  it('shows a decorative avatar and links the name to the profile, unless told not to', () => {
    const linked = mountComponent(AdminUserLabel, { props: { username: 'thayhung' } });
    expect(linked.get('svg').attributes('aria-hidden')).toBe('true');
    expect(linked.get('a').text()).toBe('thayhung');
    expect(linked.get('a').attributes('href')).toBe('/users/thayhung');
    const plain = mountComponent(AdminUserLabel, {
      props: { username: 'thayhung', link: false },
    });
    expect(plain.find('a').exists()).toBe(false);
    expect(plain.text()).toBe('thayhung');
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

  it('ignores a pick while an upload is running, and says so to assistive technology', async () => {
    const wrapper = mountComponent(UploadButton, {
      props: { label: 'Tải lên', isPending: true },
    });
    await pickFile(wrapper, new File(['x'], 'a.pdf'));
    expect(wrapper.emitted('picked')).toBeUndefined();
    expect(wrapper.get('label').attributes('aria-disabled')).toBe('true');
  });
});

describe('OrganizationChips', () => {
  const addSlug = async (wrapper: ReturnType<typeof mountComponent>, slug: string) => {
    await wrapper.get('input').setValue(slug);
    await wrapper.get('input').trigger('keydown', { key: 'Enter' });
    await flushPromises();
  };

  it('adds an exact slug as its id, never twice, and refuses an unknown slug', async () => {
    mockApi({
      ...anonymousViewer,
      'GET /organizations/thpt-hung-vuong': ok({
        id: 'org-a',
        slug: 'thpt-hung-vuong',
        name: 'THPT Hùng Vương',
      }),
      'GET /organizations/nope': fail(404, 'not_found'),
    });
    const wrapper = mountComponent(ChipsHost, {
      props: { component: OrganizationChips, initial: [{ id: ID_A, slug: null }] },
    });
    expect(wrapper.text()).toContain('0192…9c21');
    await addSlug(wrapper, 'thpt-hung-vuong');
    await addSlug(wrapper, 'thpt-hung-vuong');
    expect(wrapper.findAll('[data-testid="organization-chip"]')).toHaveLength(2);
    expect(wrapper.get('output').text()).toContain('"slug":"thpt-hung-vuong"');
    await addSlug(wrapper, 'nope');
    expect(wrapper.text()).toContain('Không có tổ chức "nope".');
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true');
  });

  it('shows a locked list read-only and says which permission it needs', () => {
    const wrapper = mountComponent(OrganizationChips, {
      props: {
        modelValue: [{ id: 'org-a', slug: 'thpt-hung-vuong' }],
        label: 'Tổ chức',
        lockedBy: 'judge.edit_all_problem',
      },
    });
    expect(wrapper.get('input').attributes('disabled')).toBeDefined();
    expect(wrapper.find('button').exists()).toBe(false);
    expect(wrapper.text()).toContain('Cần quyền judge.edit_all_problem');
  });
});
