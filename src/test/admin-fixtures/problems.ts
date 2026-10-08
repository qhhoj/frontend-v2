import type {
  EditableProblem,
  ProblemEditingMeta,
  ProblemEditor,
} from '@/api/types/problem-editing';
import { ok } from '../mock-api';

export const LANG_CPP20 = '0192a000-0000-7000-8000-00000000c020';
export const LANG_PY3 = '0192a000-0000-7000-8000-0000000000b3';
export const TYPE_GRAPH = '0192a000-0000-7000-8000-0000000007a1';
export const GROUP_GRAPH = '0192a000-0000-7000-8000-0000000006a1';

export const problemEditingMeta = (): ProblemEditingMeta => ({
  types: [{ id: TYPE_GRAPH, name: 'shortest', fullName: 'Đường đi ngắn nhất' }],
  groups: [{ id: GROUP_GRAPH, name: 'graph', fullName: 'Đồ thị' }],
  licenses: [],
  languages: [
    { id: LANG_CPP20, key: 'CPP20', name: 'C++20' },
    { id: LANG_PY3, key: 'PY3', name: 'Python 3' },
  ],
});

export const problemEditor = (): ProblemEditor => ({
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
  testers: [{ id: '0192a000-0000-7000-8000-0000000000bb', username: 'khoa.tester' }],
  bannedUsers: [],
  suggester: null,
  typeIds: [TYPE_GRAPH],
  groupId: GROUP_GRAPH,
  licenseId: null,
  allowedLanguageIds: [LANG_CPP20, LANG_PY3],
  organizations: [],
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
  authors: [{ id: '0192a000-0000-7000-8000-0000000000aa', username: 'thayhung' }],
  languageLimits: [{ language: 'PY3', timeLimit: 4.5, memoryLimit: 262144 }],
  pdfStatementUrl: null,
  materialUrl: null,
  submissionSourceVisibility: 'O',
  testcaseVisibility: 'C',
  testcaseResultVisibility: 'B',
  allowViewFeedback: true,
  canEdit: true,
  editor: problemEditor(),
  ...overrides,
});

export const problemEditorRoutes = (problem: EditableProblem = editableProblem()) => ({
  [`GET /problems/${problem.code}`]: ok(problem),
  'GET /problems/meta': ok(problemEditingMeta()),
});
