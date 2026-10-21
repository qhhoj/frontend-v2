import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, ok, page } from '@/test/mock-api';
import type { ApiCall } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';
import { organizationItem, profile, sessionUser, signedIn } from '@/test/fixtures';
import { polygonProblem } from '@/test/admin-fixtures/polygon';
import { problemEditingMeta } from '@/test/admin-fixtures/problems';

type Wrapper = Awaited<ReturnType<typeof mountApp>>['wrapper'];

const LINK = 'https://polygon.codeforces.com/p3n21nw/LamTerQH/xau-doi-xung';
/** An organization admin with the organization problem right, without `judge.add_problem` or the Polygon sync permission. */
const teacher = () =>
  sessionUser({
    isStaff: true,
    permissions: ['judge.create_organization_problem', 'judge.edit_own_problem'],
    adminCapabilities: {
      organizations: true,
      problemCreation: { site: false, organizations: true },
      contestCreation: { site: false, organizations: false },
    },
  });
const teacherRoutes = () => ({
  'GET /auth/me': signedIn({ user: teacher() }),
  'GET /profile': ok(profile()),
  'GET /organizations': page([organizationItem()]),
  'GET /problems/meta': ok(problemEditingMeta()),
});
const buttonLabelled = (wrapper: Wrapper, label: string) =>
  wrapper.findAll('button').find((button) => button.text() === label)!;

/** Polygon import, steps 1 and 2: the link is checked, then the options form opens (`marker` is what the test waits for). */
async function openPolygonOptions(wrapper: Wrapper, marker: string) {
  await vi.waitFor(() => expect(wrapper.find('#polygon-link').exists()).toBe(true), {
    timeout: 5000,
  });
  await wrapper.get('#polygon-link').setValue(LINK);
  await vi.waitFor(
    () => expect(wrapper.find('[data-testid="polygon-link-preview"]').exists()).toBe(true),
    { timeout: 5000 },
  );
  await buttonLabelled(wrapper, 'Tiếp tục').trigger('click');
  await vi.waitFor(() => expect(wrapper.find(marker).exists()).toBe(true));
}

describe('imports by an organization problem creator', () => {
  it('opens the zip import with the organization as the only owner, and update for its editor', async () => {
    mockApi(teacherRoutes());
    const { wrapper } = await mountApp('/admin/problems/import');
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="problem-code-prefix"]').exists()).toBe(true),
    );
    expect(wrapper.find('[data-testid="admin-forbidden"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="creation-owner"]').text()).toContain('THPT A');
    expect(wrapper.text()).not.toContain('Không thuộc tổ chức');
    const radios = wrapper.findAll('input[name="import-mode"]');
    expect(radios.map((radio) => (radio.element as HTMLInputElement).disabled)).toEqual([
      false,
      false,
    ]);
  });

  it('imports from Polygon into the organization without the auto-sync switch', async () => {
    const calls = mockApi({
      ...teacherRoutes(),
      'GET /polygon/status': ok({ connected: true, accountName: 'qhhoj' }),
      'GET /problems/imports': ok([]),
      'POST /polygon/resolve': ok(polygonProblem()),
      'POST /polygon/import': { status: 202, body: { data: { jobId: 'job-1' } } },
      'GET /problems/imports/job-1': ok({
        id: 'job-1',
        state: 'active',
        step: 'downloading',
        progress: null,
        result: null,
        error: null,
        failedStep: null,
      }),
    });
    const { wrapper } = await mountApp('/admin/problems/polygon');
    await openPolygonOptions(wrapper, '[data-testid="problem-code-prefix"]');
    expect(wrapper.text()).not.toContain('Tự đồng bộ khi có gói mới');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    const post = calls.find((call) => call.path === '/polygon/import');
    expect(post?.body).toMatchObject({
      organization: 'thpt-a',
      code: 'thpta_xau_doi_xung',
      mode: 'create',
      autoSync: false,
    });
  });

  it('keeps the imports closed to a viewer who may neither create nor edit a problem', async () => {
    mockApi(staffViewer(['judge.change_comment']));
    const { wrapper } = await mountApp('/admin/problems/import');
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="admin-forbidden"]').exists()).toBe(true),
    );
  });
});

describe('imports when the viewer has nowhere to create', () => {
  const emptyRoutes = () => ({
    ...teacherRoutes(),
    'GET /organizations': page([]),
    'GET /polygon/status': ok({ connected: true, accountName: 'qhhoj' }),
    'GET /problems/imports': ok([]),
    'POST /polygon/resolve': ok(polygonProblem()),
  });
  const NONE = '[data-testid="creation-owner-none"]';
  const BLOCKED = 'Chưa có nơi để tạo';
  const submitOf = (wrapper: Wrapper) => wrapper.get('button[type="submit"]');
  const reasonOf = (wrapper: Wrapper) =>
    wrapper.get(`#${submitOf(wrapper).attributes('aria-describedby')}`).text();
  const posts = (calls: ApiCall[]) => calls.filter((call) => call.method === 'POST');
  const askedKinds = (calls: ApiCall[]) =>
    calls
      .filter((call) => call.method === 'GET' && call.path === '/organizations')
      .map((call) => call.query.get('canCreate'));

  it('keeps the zip import closed and, once a file is chosen, still says why beside the submit', async () => {
    const calls = mockApi(emptyRoutes());
    const { wrapper } = await mountApp('/admin/problems/import');
    await vi.waitFor(() => expect(wrapper.find(NONE).exists()).toBe(true));
    // The reason leads with what a file cannot fix.
    expect(submitOf(wrapper).attributes('aria-disabled')).toBe('true');
    expect(reasonOf(wrapper)).toContain(BLOCKED);
    const input = wrapper.get('[data-testid="polygon-file"] input');
    Object.defineProperty(input.element, 'files', { value: [new File(['zip'], 'p.zip')] });
    await input.trigger('change');
    await wrapper.get('#import-code').setValue('hcmus41c');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(submitOf(wrapper).attributes('aria-disabled')).toBe('true');
    expect(reasonOf(wrapper)).toContain(BLOCKED);
    expect(posts(calls)).toEqual([]);
    expect(askedKinds(calls)).toEqual(['problem']);
  });

  it('does the same for the Polygon import', async () => {
    const calls = mockApi(emptyRoutes());
    const { wrapper } = await mountApp('/admin/problems/polygon');
    await openPolygonOptions(wrapper, NONE);
    expect(submitOf(wrapper).attributes('aria-disabled')).toBe('true');
    expect(reasonOf(wrapper)).toContain(BLOCKED);
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(posts(calls).filter((call) => call.path === '/polygon/import')).toEqual([]);
    expect(askedKinds(calls)).toEqual(['problem']);
  });

  it('says only that a file is missing once the viewer switches to updating', async () => {
    mockApi(emptyRoutes());
    const { wrapper } = await mountApp('/admin/problems/import');
    await vi.waitFor(() => expect(wrapper.find(NONE).exists()).toBe(true));
    await wrapper.get('input[name="import-mode"][value="update"]').setValue();
    await flushPromises();
    expect(wrapper.find(NONE).exists()).toBe(false);
    expect(reasonOf(wrapper)).not.toContain(BLOCKED);
    expect(reasonOf(wrapper)).toContain('Chọn gói .zip');
  });
});
