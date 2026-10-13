import type {
  FlatpageAdmin,
  FlatpageListItem,
  FlatpageRevision,
} from '../../api/types/flatpages-admin';

export const flatpageItem = (overrides: Partial<FlatpageListItem> = {}): FlatpageListItem => ({
  id: 'fp-1',
  url: '/about',
  title: 'Giới thiệu',
  registrationRequired: false,
  updatedAt: '2026-10-08T09:00:00.000Z',
  ...overrides,
});

export const flatpage = (overrides: Partial<FlatpageAdmin> = {}): FlatpageAdmin => ({
  ...flatpageItem(),
  content: '## QHHOJ là gì?\n- Hơn **1 200** bài tập',
  contentHtml: '<h2>QHHOJ là gì?</h2><ul><li>Hơn <strong>1 200</strong> bài tập</li></ul>',
  createdAt: '2026-10-01T09:00:00.000Z',
  ...overrides,
});

export const flatpageRevision = (overrides: Partial<FlatpageRevision> = {}): FlatpageRevision => ({
  id: 'rev-1',
  at: '2026-10-09T07:22:00.000Z',
  action: 'edit',
  editor: { id: '0192a000-0000-7000-8000-00000000a001', username: 'bitcoder', rating: null },
  changes: {
    title: { before: 'Giới thiệu', after: 'Giới thiệu QHHOJ' },
    content: { before: '- Hơn **1 000** bài tập', after: '- Hơn **1 200** bài tập' },
  },
  ...overrides,
});

/** Newest first, as the API sends them: an edit by a deleted account, an edit, and the creation. */
export const FLATPAGE_HISTORY: FlatpageRevision[] = [
  flatpageRevision(),
  flatpageRevision({
    id: 'rev-2',
    editor: null,
    changes: { url: { before: '/gioi-thieu', after: '/about' } },
  }),
  flatpageRevision({
    id: 'rev-3',
    action: 'create',
    changes: { title: { before: null, after: 'Giới thiệu' } },
  }),
];
