import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, ok, quotaExceeded } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';
import {
  problemData,
  problemEditingMeta,
  problemEditorRoutes,
  TYPE_GRAPH,
} from '@/test/admin-fixtures/problems';

type Wrapper = Awaited<ReturnType<typeof mountApp>>['wrapper'];

const MIB = 1048576;
/** The backend's real refusal: `details` plus one issue on the meter name (`credits` or `storage`), never on a form field. */
const CREDITS = quotaExceeded({ meter: 'credits', limit: 200, used: 194, needed: 10 });
const CREDITS_TEXT = 'cần 10, còn lại 6 (đã dùng 194 / 200)';
const STORAGE = quotaExceeded({
  meter: 'storage',
  limit: 512 * MIB,
  used: 500 * MIB,
  needed: 25 * MIB,
});
const STORAGE_TEXT = 'cần 25 MiB, còn lại 12 MiB (đã dùng 500 MiB / 512 MiB)';

const waitFor = (wrapper: Wrapper, selector: string) =>
  vi.waitFor(() => expect(wrapper.find(selector).exists()).toBe(true), { timeout: 5000 });
const pressButton = (wrapper: Wrapper, label: string) =>
  wrapper
    .findAll('button')
    .find((button) => button.text() === label)!
    .trigger('click');
const alertText = (wrapper: Wrapper) => wrapper.get('[role="alert"]').text();

describe('quota refusals show their numbers on every create, clone and upload form', () => {
  it('the problem clone card', async () => {
    mockApi({
      ...staffViewer(['judge.edit_own_problem', 'judge.clone_problem']),
      ...problemEditorRoutes(),
      'POST /problems/hcmus41c/clone': CREDITS,
    });
    const { wrapper } = await mountApp('/admin/problems/hcmus41c/general');
    await waitFor(wrapper, '#problem-clone-code');
    await wrapper.get('#problem-clone-code').setValue('hcmus41c_ban_sao');
    await pressButton(wrapper, 'Nhân bản');
    await flushPromises();
    expect(alertText(wrapper)).toContain(CREDITS_TEXT);
  });

  it('the new problem form', async () => {
    mockApi({
      ...staffViewer(['judge.add_problem']),
      'GET /problems/meta': ok(problemEditingMeta()),
      'POST /problems': CREDITS,
    });
    const { wrapper } = await mountApp('/admin/problems/new');
    await waitFor(wrapper, '#problem-code');
    await wrapper.get('#problem-code').setValue('newp');
    await wrapper.get('#problem-name').setValue('New');
    await wrapper.get('#problem-type-pick').setValue(TYPE_GRAPH);
    await pressButton(wrapper, 'Thêm loại');
    await pressButton(wrapper, 'Tạo bài');
    await flushPromises();
    expect(alertText(wrapper)).toContain(CREDITS_TEXT);
  });

  it('the data archive upload (storage meter)', async () => {
    mockApi({
      ...staffViewer(['judge.edit_own_problem']),
      ...problemEditorRoutes(),
      'GET /problems/hcmus41c/data': ok(problemData()),
      'POST /problems/hcmus41c/data/archive': STORAGE,
    });
    const { wrapper } = await mountApp('/admin/problems/hcmus41c/data');
    await waitFor(wrapper, '[data-testid="upload-archive"] input');
    const input = wrapper.get('[data-testid="upload-archive"] input');
    Object.defineProperty(input.element, 'files', { value: [new File(['zip'], 'p.zip')] });
    await input.trigger('change');
    await flushPromises();
    expect(alertText(wrapper)).toContain(STORAGE_TEXT);
  });

  it('the Polygon import: a storage refusal has no form field, so the page line carries it', async () => {
    mockApi({
      ...staffViewer(['judge.import_polygon_package', 'judge.add_problem']),
      'GET /problems/meta': ok(problemEditingMeta()),
      'POST /problems/imports': STORAGE,
    });
    const { wrapper } = await mountApp('/admin/problems/import');
    await waitFor(wrapper, '[data-testid="polygon-file"] input');
    const input = wrapper.get('[data-testid="polygon-file"] input');
    Object.defineProperty(input.element, 'files', { value: [new File(['zip'], 'p.zip')] });
    await input.trigger('change');
    await wrapper.get('#import-code').setValue('hcmus41c');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(alertText(wrapper)).toContain(STORAGE_TEXT);
  });

  it('the Polygon import still shows a field issue under its field and no page line', async () => {
    mockApi({
      ...staffViewer(['judge.import_polygon_package', 'judge.add_problem']),
      'GET /problems/meta': ok(problemEditingMeta()),
      'POST /problems/imports': {
        status: 400,
        body: {
          error: {
            code: 'validation_failed',
            message: 'x',
            issues: [{ field: 'code', code: 'invalid', message: 'Taken' }],
          },
        },
      },
    });
    const { wrapper } = await mountApp('/admin/problems/import');
    await waitFor(wrapper, '[data-testid="polygon-file"] input');
    const input = wrapper.get('[data-testid="polygon-file"] input');
    Object.defineProperty(input.element, 'files', { value: [new File(['zip'], 'p.zip')] });
    await input.trigger('change');
    await wrapper.get('#import-code').setValue('hcmus41c');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });
});
