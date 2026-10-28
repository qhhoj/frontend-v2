import type {
  PairDetailSide,
  SimilarityGroup,
  SimilarityPair,
  SimilarityPairDetail,
  SimilarityRun,
} from '../../api/types/similarity';

interface GroupSpec extends Partial<SimilarityGroup> {
  problemCode: string;
  language: string;
  submissionCount: number;
  comparedCount: number;
  pairCount: number;
}

const group = (spec: GroupSpec): SimilarityGroup => ({
  problemId: `id-${spec.problemCode}`,
  tokenizer: 'syntax',
  skippedEmpty: 0,
  skippedTooLarge: 0,
  droppedByCap: 0,
  truncated: false,
  failed: false,
  ...spec,
});

/** The C++ groups: one truncated, one with skips, one that failed. */
const cppGroups = (): SimilarityGroup[] => [
  group({
    problemCode: 'hcmus41a',
    language: 'cpp',
    submissionCount: 188,
    comparedCount: 188,
    pairCount: 214,
  }),
  group({
    problemCode: 'hcmus41b',
    language: 'cpp',
    submissionCount: 143,
    comparedCount: 141,
    pairCount: 96,
    skippedEmpty: 2,
  }),
  group({
    problemCode: 'hcmus41c',
    language: 'cpp',
    submissionCount: 3412,
    comparedCount: 3000,
    pairCount: 802,
    truncated: true,
    skippedEmpty: 4,
    skippedTooLarge: 1,
  }),
  group({
    problemCode: 'hcmus41e',
    language: 'cpp',
    submissionCount: 29,
    comparedCount: 0,
    pairCount: 0,
    failed: true,
  }),
];

/** The other families: Python, and Pascal tokenised as text. */
const otherGroups = (): SimilarityGroup[] => [
  group({
    problemCode: 'hcmus41c',
    language: 'python',
    submissionCount: 61,
    comparedCount: 59,
    pairCount: 41,
    skippedEmpty: 2,
  }),
  group({
    problemCode: 'hcmus41d',
    language: 'pascal',
    submissionCount: 77,
    comparedCount: 77,
    pairCount: 51,
    tokenizer: 'text',
  }),
];

export const similarityRun = (overrides: Partial<SimilarityRun> = {}): SimilarityRun => ({
  id: 'run-9f02',
  scope: 'contest',
  problemId: null,
  contestId: 'id-contest',
  status: 'done',
  error: null,
  createdAt: '2026-10-08T07:10:00.000Z',
  startedAt: '2026-10-08T07:10:04.000Z',
  finishedAt: '2026-10-08T07:12:22.000Z',
  limits: { minPercent: 50, maxPairs: 5000, maxSubmissions: 3000 },
  groups: [...cppGroups(), ...otherGroups()],
  unsupported: [{ language: 'Brainf**k', submissionCount: 3 }],
  ...overrides,
});

/** The two submissions of the default pair (full uuids, as the API sends them). */
const LEFT_SUBMISSION = '0198c3a1-7d2e-7b10-9a4f-1c2d3e4f5a6b';
const RIGHT_SUBMISSION = '0198c8e4-1b2c-7d3e-8f4a-5b6c7d8e9f0a';

export const similarityPair = (overrides: Partial<SimilarityPair> = {}): SimilarityPair => ({
  id: 'pair-1',
  runId: 'run-9f02',
  problemId: 'id-hcmus41c',
  problemCode: 'hcmus41c',
  language: 'cpp',
  similarity: 0.98,
  longestFragment: 412,
  totalOverlap: 1180,
  fragmentCount: 4,
  left: { submissionId: LEFT_SUBMISSION, userId: 'u1', username: 'ngocanh' },
  right: { submissionId: RIGHT_SUBMISSION, userId: 'u2', username: 'bao_ly' },
  ...overrides,
});

const TEN_LINES = Array.from({ length: 10 }, (_unused, index) => `line ${index + 1};`).join('\n');

const detailSide = (side: SimilarityPair['left']): PairDetailSide => ({
  ...side,
  date: '2026-10-08T07:05:00.000Z',
  result: 'AC',
  points: 100,
  source: TEN_LINES,
});

export const similarityPairDetail = (): SimilarityPairDetail => {
  const pair = similarityPair();
  return {
    ...pair,
    left: detailSide(pair.left),
    right: detailSide(pair.right),
    fragments: [{ leftStart: 4, leftEnd: 6, rightStart: 6, rightEnd: 8 }],
  };
};
