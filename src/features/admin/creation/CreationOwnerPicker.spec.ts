import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, mockApi, ok, page, sequence } from '@/test/mock-api';
import type { ApiCall } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { organizationItem, profile, sessionUser, signedIn } from '@/test/fixtures';
import {
  editableProblem,
  problemEditingMeta,
  problemEditorRoutes,
} from '@/test/admin-fixtures/problems';

type Mounted = Awaited<ReturnType<typeof mountApp>>;
const mountedApps: Mounted[] = [];
afterEach(() => mountedApps.splice(0).forEach(({ wrapper }) => wrapper.unmount()));

const organization = (letter: string) =>
  organizationItem({
    id: `0192a000-0000-7000-8000-0000000000${letter.charCodeAt(0).toString(16)}`,
    slug: `thpt-${letter.toLowerCase()}`,
    name: `THPT ${letter}`,
    problemCodePrefix: `thpt${letter.toLowerCase()}_`,
  });
const orgA = organization('A');
const orgB = organization('B');
const orgC = organization('C');

/**
 * The backend's list: `canCreate` narrows to where the viewer may create that kind (A and B for a problem, A for a contest);
 * the older `administered` list also holds C, an organization the viewer administers without the right to create there.
 */
const listBy = (call: ApiCall) => {
  const kind = call.query.get('canCreate');
  if (kind === 'problem') return page([orgA, orgB]);
  if (kind === 'contest') return page([orgA]);
  return page([orgA, orgB, orgC]);
};

interface Scopes {
  problem?: { site: boolean; organizations: boolean };
  contest?: { site: boolean; organizations: boolean };
}
const NONE = { site: false, organizations: false };
/** A staff viewer whose session reports these creation scopes (`adminCapabilities`) and the permissions that go with them. */
const viewer = (scopes: Scopes, permissions: string[] = []) => ({
  'GET /auth/me': signedIn({
    user: sessionUser({
      isStaff: true,
      permissions,
      adminCapabilities: {
        organizations: true,
        problemCreation: scopes.problem ?? NONE,
        contestCreation: scopes.contest ?? NONE,
      },
    }),
  }),
  'GET /profile': ok(profile()),
});
const ORG_ONLY = { site: false, organizations: true };
const SITE_AND_ORGS = { site: true, organizations: true };

async function mountAdmin(path: string, readyMarker: string) {
  const mounted = await mountApp(path);
  mountedApps.push(mounted);
  await vi.waitFor(() => expect(mounted.wrapper.find(readyMarker).exists()).toBe(true), {
    timeout: 5000,
  });
  await flushPromises();
  return mounted;
}
const mountProblemForm = () => mountAdmin('/admin/problems/new', '[data-testid="creation-owner"]');
const mountContestForm = () => mountAdmin('/admin/contests/new', '[data-testid="creation-owner"]');
const ownerText = (wrapper: Mounted['wrapper']) =>
  wrapper.get('[data-testid="creation-owner"]').text();
const organizationCalls = (calls: ApiCall[]) =>
  calls.filter((call) => call.method === 'GET' && call.path === '/organizations');

describe('the owner a new problem or contest is created in', () => {
  it('asks for the organizations the viewer may create a problem in, and offers only those', async () => {
    const calls = mockApi({
      ...viewer({ problem: ORG_ONLY }, ['judge.create_organization_problem']),
      'GET /organizations': listBy,
      'GET /problems/meta': ok(problemEditingMeta()),
    });
    const { wrapper } = await mountProblemForm();
    const asked = organizationCalls(calls);
    expect(asked.map((call) => call.query.get('canCreate'))).toEqual(['problem']);
    expect(asked[0]!.query.has('administered')).toBe(false);
    expect(ownerText(wrapper)).toContain('THPT A');
    expect(ownerText(wrapper)).toContain('THPT B');
    expect(ownerText(wrapper)).not.toContain('THPT C');
    expect(wrapper.findAll('[data-testid="creation-owner"] input[type="radio"]')).toHaveLength(2);
  });

  it('asks for the organizations the viewer may create a contest in, and offers only those', async () => {
    const calls = mockApi({
      ...viewer({ contest: ORG_ONLY }, ['judge.create_private_contest']),
      'GET /organizations': listBy,
    });
    const { wrapper } = await mountContestForm();
    expect(organizationCalls(calls).map((call) => call.query.get('canCreate'))).toEqual([
      'contest',
    ]);
    // One organization and no site right: nothing to choose, so the owner is a fixed line.
    expect(ownerText(wrapper)).toContain('THPT A');
    expect(ownerText(wrapper)).toContain('Cố định');
    expect(ownerText(wrapper)).not.toContain('THPT B');
    expect(ownerText(wrapper)).not.toContain('THPT C');
    expect(wrapper.find('[data-testid="creation-owner"] input').exists()).toBe(false);
  });

  it('lists the site beside the returned organizations for a site-wide creator', async () => {
    mockApi({
      ...viewer({ contest: SITE_AND_ORGS }, ['judge.add_contest', 'judge.create_private_contest']),
      'GET /organizations': listBy,
    });
    const { wrapper } = await mountContestForm();
    const options = wrapper.findAll('[data-testid="creation-owner"] option');
    expect(options.map((option) => option.text())).toEqual([
      'Không thuộc tổ chức',
      'THPT A (thpta_…)',
    ]);
  });

  it('reads every page of the list, so an organization past the first hundred is offered', async () => {
    const many = Array.from({ length: 101 }, (_item, index) =>
      organizationItem({
        id: `0192a000-0000-7000-8000-${String(index).padStart(12, '0')}`,
        slug: `school-${index}`,
        name: `School ${index}`,
      }),
    );
    const calls = mockApi({
      ...viewer({ contest: ORG_ONLY }, ['judge.create_private_contest']),
      'GET /organizations': (call) => {
        const pageNumber = Number(call.query.get('page'));
        const items = pageNumber === 1 ? many.slice(0, 100) : many.slice(100);
        return page(items, { page: pageNumber, pageSize: 100, total: 101 });
      },
    });
    const { wrapper } = await mountContestForm();
    expect(organizationCalls(calls).map((call) => call.query.get('page'))).toEqual(['1', '2']);
    const options = wrapper.findAll('[data-testid="creation-owner"] option');
    expect(options).toHaveLength(101);
    expect(options.at(-1)!.text()).toContain('School 100');
  });
});

describe('a viewer with no creation scope', () => {
  it('is asked for no owner and loads no organizations, and can still suggest a problem', async () => {
    const calls = mockApi({
      ...viewer({}, ['judge.suggest_new_problem']),
      'GET /problems/meta': ok(problemEditingMeta()),
    });
    const { wrapper } = await mountAdmin('/admin/problems/new', '#problem-name');
    expect(wrapper.find('[data-testid="creation-owner"]').exists()).toBe(false);
    expect(organizationCalls(calls)).toEqual([]);
    expect(wrapper.findAll('button').some((button) => button.text() === 'Gửi đề xuất bài')).toBe(
      true,
    );
  });
});

describe('an owner picker with nothing to offer', () => {
  it('says why a problem cannot be created anywhere, leads to the organizations and offers no creation', async () => {
    mockApi({
      ...viewer({ problem: ORG_ONLY }, ['judge.create_organization_problem']),
      'GET /organizations': page([]),
      'GET /problems/meta': ok(problemEditingMeta()),
    });
    const { wrapper } = await mountProblemForm();
    const notice = wrapper.get('[data-testid="creation-owner-none"]');
    expect(notice.text()).toContain('Chưa có tổ chức nào để tạo bài tập');
    expect(notice.get('a').attributes('href')).toBe('/organizations');
    expect(
      wrapper
        .find('[data-testid="creation-owner"] input, [data-testid="creation-owner"] select')
        .exists(),
    ).toBe(false);
    expect(wrapper.findAll('button').some((button) => button.text() === 'Tạo bài')).toBe(false);
  });

  it('keeps the contest save bar from submitting, and says so', async () => {
    const calls = mockApi({
      ...viewer({ contest: ORG_ONLY }, ['judge.create_private_contest']),
      'GET /organizations': page([]),
    });
    const { wrapper } = await mountContestForm();
    expect(wrapper.get('[data-testid="creation-owner-none"]').text()).toContain(
      'Chưa có tổ chức nào để tạo kỳ thi',
    );
    const submit = wrapper.get('button[type="submit"]');
    expect(submit.attributes('aria-disabled')).toBe('true');
    expect(wrapper.text()).toContain('Chưa có nơi để tạo kỳ thi');
    await submit.trigger('click');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(calls.filter((call) => call.method === 'POST')).toEqual([]);
  });

  it('shows a load failure as its own state, and a retry brings the organizations', async () => {
    mockApi({
      ...viewer({ problem: ORG_ONLY }, ['judge.create_organization_problem']),
      'GET /organizations': sequence(fail(500, 'internal_error'), page([orgA, orgB])),
      'GET /problems/meta': ok(problemEditingMeta()),
    });
    const { wrapper } = await mountProblemForm();
    expect(wrapper.find('[data-testid="creation-owner-none"]').exists()).toBe(false);
    const failed = wrapper.get('[data-testid="creation-owner-failed"]');
    await failed.get('button').trigger('click');
    await flushPromises();
    expect(wrapper.find('[data-testid="creation-owner-failed"]').exists()).toBe(false);
    expect(ownerText(wrapper)).toContain('THPT A');
    expect(ownerText(wrapper)).toContain('THPT B');
  });

  it('lets a site-wide creator carry on when the list fails, with the failure shown beside the site', async () => {
    mockApi({
      ...viewer({ problem: SITE_AND_ORGS }, ['judge.add_problem']),
      'GET /organizations': fail(500, 'internal_error'),
      'GET /problems/meta': ok(problemEditingMeta()),
    });
    const { wrapper } = await mountProblemForm();
    expect(wrapper.find('[data-testid="creation-owner-failed"]').exists()).toBe(true);
    expect(ownerText(wrapper)).toContain('Không thuộc tổ chức');
    expect(wrapper.findAll('button').some((button) => button.text() === 'Tạo bài')).toBe(true);
  });
});

describe('moving a problem between organizations', () => {
  it('adds only organizations the viewer may create problems in', async () => {
    const calls = mockApi({
      ...viewer({ problem: ORG_ONLY }, [
        'judge.edit_own_problem',
        'judge.create_organization_problem',
      ]),
      ...problemEditorRoutes(editableProblem()),
      'GET /organizations': listBy,
    });
    const { wrapper } = await mountAdmin(
      '/admin/problems/hcmus41c/general?view=advanced',
      '[data-testid="people-organizations"]',
    );
    expect(organizationCalls(calls).map((call) => call.query.get('canCreate'))).toEqual([
      'problem',
    ]);
    const options = wrapper.findAll('[data-testid="people-organizations"] option');
    expect(options.map((option) => option.text())).toEqual([
      'Thêm vào tổ chức…',
      'THPT A',
      'THPT B',
    ]);
  });
});
