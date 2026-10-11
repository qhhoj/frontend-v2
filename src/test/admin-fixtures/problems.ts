import type {
  EditableProblem,
  ProblemEditingMeta,
  ProblemEditor,
} from '../../api/types/problem-editing';
import type { ProblemData, TestCase } from '../../api/types/problem-data';

/** The same shape as mock-api's `ok`; importing mock-api would pull the `@` alias into the e2e project. */
const ok = (data: unknown) => ({ body: { data } });

export const LANG_CPP20 = '0192a000-0000-7000-8000-00000000c020';
export const LANG_PY3 = '0192a000-0000-7000-8000-0000000000b3';
export const TYPE_GRAPH = '0192a000-0000-7000-8000-0000000007a1';
export const GROUP_GRAPH = '0192a000-0000-7000-8000-0000000006a1';

const editingLanguage = (
  id: string,
  key: string,
  name: string,
): ProblemEditingMeta['languages'][number] => ({
  id,
  key,
  name,
  shortName: null,
  commonName: name,
  isActive: true,
  ace: 'text',
  extension: 'txt',
  template: '',
  fileOnly: false,
  fileSizeLimit: 0,
  includeInProblem: true,
});

export const problemEditingMeta = (): ProblemEditingMeta => ({
  types: [{ id: TYPE_GRAPH, name: 'shortest', fullName: 'Đường đi ngắn nhất' }],
  groups: [{ id: GROUP_GRAPH, name: 'graph', fullName: 'Đồ thị' }],
  licenses: [],
  languages: [
    editingLanguage(LANG_CPP20, 'CPP20', 'C++20'),
    editingLanguage(LANG_PY3, 'PY3', 'Python 3'),
  ],
});

export const problemEditor = (): ProblemEditor => ({
  baseName: 'Đường đi ngắn nhất có ràng buộc',
  description: 'Cho đồ thị vô hướng gồm $n$ đỉnh.',
  translations: [
    {
      language: 'vi',
      name: 'Đường đi ngắn nhất có ràng buộc',
      description: 'Cho đồ thị vô hướng gồm $n$ đỉnh.',
    },
  ],
  solution: null,
  curators: [],
  testers: [{ id: '0192a000-0000-7000-8000-0000000000bb', username: 'khoa.tester', rating: null }],
  bannedUsers: [],
  suggester: null,
  typeIds: [TYPE_GRAPH],
  groupId: GROUP_GRAPH,
  licenseId: null,
  allowedLanguageIds: [LANG_CPP20, LANG_PY3],
  organizations: [],
  ogImage: '',
  canPublishToMembers: false,
});

export const editableProblem = (overrides: Partial<EditableProblem> = {}): EditableProblem => ({
  id: '0192a000-0000-7000-8000-0000000041c0',
  code: 'hcmus41c',
  name: 'Đường đi ngắn nhất có ràng buộc',
  source: '',
  summary: 'Tìm đường đi ngắn nhất.',
  date: '2026-10-01T00:00:00.000Z',
  timeLimit: 1.5,
  memoryLimit: 262144,
  points: 1200,
  partial: true,
  isPublic: false,
  isManuallyManaged: false,
  isFullMarkup: false,
  isOrganizationPrivate: false,
  authors: [{ id: '0192a000-0000-7000-8000-0000000000aa', username: 'thayhung', rating: null }],
  languageLimits: [{ language: 'PY3', timeLimit: 4.5, memoryLimit: 262144 }],
  pdfStatementUrl: null,
  materialUrl: null,
  submissionSourceVisibility: 'O',
  testcaseVisibility: 'C',
  testcaseResultVisibility: 'B',
  allowViewFeedback: true,
  canEdit: true,
  acRate: 0,
  userCount: 0,
  hasEditorial: false,
  viewerStatus: null,
  externalJudge: null,
  contest: null,
  language: 'vi',
  translated: true,
  descriptionHtml: '',
  types: [],
  group: null,
  allowedLanguages: [],
  availableTranslations: ['vi'],
  license: null,
  organizations: [],
  editor: problemEditor(),
  ...overrides,
});

export const problemEditorRoutes = (problem: EditableProblem = editableProblem()) => ({
  [`GET /problems/${problem.code}`]: ok(problem),
  'GET /problems/meta': ok(problemEditingMeta()),
  // The setup checklist of a private problem reads its test data.
  [`GET /problems/${problem.code}/data`]: ok(problemData()),
});

export const testCase = (overrides: Partial<TestCase>): TestCase => ({
  type: 'C',
  input: '',
  output: '',
  points: null,
  isPretest: false,
  generatorArgs: '',
  checker: '',
  checkerArgs: null,
  outputPrefix: null,
  outputLimit: null,
  ...overrides,
});

export const problemData = (overrides: Partial<ProblemData> = {}): ProblemData => ({
  archive: 'hcmus41c.zip',
  generator: 'gen.cpp',
  customChecker: null,
  customGrader: null,
  customHeader: null,
  checker: 'standard',
  checkerArgs: null,
  grader: 'standard',
  graderArgs: null,
  outputPrefix: null,
  outputLimit: null,
  unicode: false,
  nobigmath: false,
  feedback: '',
  cases: [
    testCase({ type: 'C', input: '1.in', output: '1.out', points: 0, isPretest: true }),
    testCase({ type: 'S', points: 30, checker: 'floatsabs', checkerArgs: { precision: 6 } }),
    testCase({ type: 'C', input: 'sub1/01.in', output: 'sub1/01.out' }),
    testCase({ type: 'C', input: 'sub1/02.in', output: 'sub1/02.out' }),
    testCase({ type: 'E' }),
  ],
  archiveFiles: ['1.in', '1.out', 'sub1/01.in', 'sub1/01.out', 'sub1/02.in', 'sub1/02.out'],
  hasInit: true,
  limits: { softCases: 50, maxCases: 300 },
  ...overrides,
});
