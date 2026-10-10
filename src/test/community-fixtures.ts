import type { PostDetail, PostListItem } from '../api/types/blog';
import type {
  Comment,
  CommentDetail,
  CommentRevision,
  CommentThreadPage,
  RecentComment,
} from '../api/types/comments';
import type { Flatpage } from '../api/types/flatpages';
import type { HomeResponse } from '../api/types/home';
import type {
  JoinRequest,
  OrganizationDetail,
  OrganizationListItem,
  OrganizationMember,
  OrganizationSummary,
} from '../api/types/organizations';
import type {
  CannedReply,
  TicketDetail,
  TicketListItem,
  TicketMessage,
  TicketTimelineEntry,
  TicketTimelineEvent,
} from '../api/types/tickets';
import type { ActivityResponse, PpEntry, SolvedResponse } from '../api/types/users';
import { HOME_COUNTS, sessionUser } from './fixtures';

/** UUID v7-shaped ids (the backend validates `before` and `parentId` as v7). */
export const communityId = (suffix: number) =>
  `0192a000-0000-7000-8000-${String(suffix).padStart(12, '0')}`;
export const VIEWER = { id: sessionUser().id, username: sessionUser().username, rating: null };
export const OTHER_USER = { id: communityId(901), username: 'ngoc_anh', rating: null };
export const ADMIN_USER = { id: communityId(902), username: 'thayhung', rating: null };

export const organizationSummary = (
  overrides: Partial<OrganizationSummary> = {},
): OrganizationSummary => ({
  id: communityId(301),
  slug: 'lhp',
  name: 'THPT chuyên Lê Hồng Phong',
  shortName: 'LHP',
  isOpen: true,
  ...overrides,
});
export const organizationItem = (
  overrides: Partial<OrganizationListItem> = {},
): OrganizationListItem => ({
  ...organizationSummary(),
  isUnlisted: false,
  memberCount: 842,
  performancePoints: 481230,
  ...overrides,
});
export const organizationDetail = (
  overrides: Partial<OrganizationDetail> = {},
): OrganizationDetail => ({
  ...organizationItem(),
  aboutHtml: '<p>Câu lạc bộ Tin học.</p>',
  about: null,
  slots: null,
  logoOverrideImage: '',
  createdAt: '2019-08-20T02:00:00Z',
  admins: [ADMIN_USER],
  viewer: { isMember: false, canAdminister: false, pendingRequestId: null },
  ...overrides,
});
export const member = (
  rank: number,
  username: string,
  overrides: Partial<OrganizationMember> = {},
): OrganizationMember => ({
  rank,
  id: communityId(400 + rank),
  username,
  displayName: username,
  displayRank: 'user',
  points: 4000 - rank,
  performancePoints: 3000 - rank,
  problemCount: 200 - rank,
  rating: 1500,
  ...overrides,
});
export const joinRequest = (overrides: Partial<JoinRequest> = {}): JoinRequest => ({
  id: communityId(501),
  organizationSlug: 'hcmus',
  userId: communityId(903),
  username: 'hieu_cpp',
  state: 'P',
  reason: 'Em muốn tham gia đội tuyển.',
  createdAt: '2026-10-08T10:00:00Z',
  decidedBy: null,
  decidedAt: null,
  ...overrides,
});

export const postItem = (overrides: Partial<PostListItem> = {}): PostListItem => ({
  id: communityId(601),
  title: 'Hướng dẫn chi tiết: Quy hoạch động trên cây cho người mới',
  slug: 'dp-tren-cay',
  authors: [OTHER_USER],
  sticky: false,
  globalPost: true,
  visible: true,
  publishOn: '2026-10-06T08:00:00Z',
  summaryHtml: '<p>Từ tập độc lập đến rerooting.</p>',
  score: 58,
  viewerVote: 0,
  commentCount: 22,
  ...overrides,
});
export const postDetail = (overrides: Partial<PostDetail> = {}): PostDetail => ({
  ...postItem(),
  contentHtml: '<h2>1. Bài toán mở đầu</h2><p>Cho cây n đỉnh.</p>',
  ogImage: '',
  organization: null,
  canEdit: false,
  canDelete: false,
  content: null,
  summary: null,
  ...overrides,
});

export const comment = (overrides: Partial<Comment> = {}): Comment => ({
  id: communityId(701),
  parentId: null,
  depth: 0,
  author: { id: communityId(904), username: 'linhnt', rating: null },
  createdAt: '2026-10-08T10:00:00Z',
  updatedAt: '2026-10-08T10:00:00Z',
  bodyHtml: '<p>Phần rerooting giải thích rất rõ.</p>',
  body: null,
  score: 12,
  collapsed: false,
  revisions: 0,
  viewerVote: 0,
  canEdit: false,
  canDelete: false,
  hidden: false,
  hiddenBy: null,
  deleted: false,
  number: null,
  ...overrides,
});
export const commentThreadPage = (
  overrides: Partial<CommentThreadPage> = {},
): CommentThreadPage => ({
  page: { type: 'blog', key: communityId(601), title: postItem().title },
  locked: false,
  pageLocked: false,
  canComment: true,
  postBlock: null,
  comments: [comment()],
  pagination: { page: 1, pageSize: 20, total: 1 },
  ...overrides,
});
export const commentDetail = (overrides: Partial<CommentDetail> = {}): CommentDetail => ({
  ...comment(),
  page: commentThreadPage().page,
  hidden: false,
  ...overrides,
});
export const recentComment = (overrides: Partial<RecentComment> = {}): RecentComment => ({
  ...comment(),
  page: { type: 'blog', key: communityId(601), title: 'Editorial QHH Round #11' },
  ...overrides,
});
export const commentRevision = (overrides: Partial<CommentRevision> = {}): CommentRevision => ({
  at: '2026-10-08T14:02:00Z',
  editor: VIEWER,
  before: 'Bạn có thể giải thích vì sao phải lưu cả down và up?',
  after: 'Bạn có thể giải thích vì sao phải lưu cả hai giá trị down và up không ạ?',
  ...overrides,
});

export const ticketItem = (overrides: Partial<TicketListItem> = {}): TicketListItem => ({
  id: communityId(801),
  title: 'Test 17 của bài Trò chơi trên cây có vẻ sai',
  creator: VIEWER,
  assignees: [{ id: communityId(905), username: 'colan', rating: null }],
  link: {
    type: 'problem',
    id: communityId(802),
    key: 'hcmus41b',
    title: 'Trò chơi trên cây',
    url: '/problems/hcmus41b',
  },
  isOpen: true,
  isContributive: false,
  messageCount: 4,
  createdAt: '2026-10-08T13:12:00Z',
  lastMessageAt: '2026-10-08T14:20:00Z',
  ...overrides,
});
export const ticketMessage = (overrides: Partial<TicketMessage> = {}): TicketMessage => ({
  id: communityId(811),
  author: VIEWER,
  bodyHtml: '<p>Ở test 17, đáp án mẫu in ra 1.</p>',
  createdAt: '2026-10-08T13:12:00Z',
  ...overrides,
});
/** One message as a row of the thread's timeline. */
export const messageEntry = (message: TicketMessage = ticketMessage()): TicketTimelineEntry => ({
  kind: 'message',
  at: message.createdAt,
  message,
  event: null,
});
/** The timeline follows `messages` unless a test gives its own. */
export const ticketDetail = (overrides: Partial<TicketDetail> = {}): TicketDetail => {
  const messages = overrides.messages ?? [ticketMessage()];
  return {
    ...ticketItem(),
    notes: '',
    messages,
    timeline: messages.map(messageEntry),
    can: { editNotes: false, markGood: false, assign: false },
    ...overrides,
  };
};

export const timelineEvent = (
  overrides: Partial<TicketTimelineEvent> = {},
): TicketTimelineEvent => ({
  id: communityId(821),
  type: 'closed',
  actor: ADMIN_USER,
  target: null,
  at: '2026-10-08T14:22:00Z',
  ...overrides,
});
/** One event as a row of the thread's timeline. */
export const eventEntry = (event: TicketTimelineEvent = timelineEvent()): TicketTimelineEntry => ({
  kind: 'event',
  at: event.at,
  message: null,
  event,
});
export const cannedReply = (overrides: Partial<CannedReply> = {}): CannedReply => ({
  id: communityId(831),
  title: 'Đã nhận phiếu',
  body: 'Chào {tên}, cảm ơn bạn đã báo lỗi ở bài {bài}. Mình đang kiểm tra lại.',
  order: 0,
  createdAt: '2026-10-08T01:00:00Z',
  updatedAt: '2026-10-08T01:00:00Z',
  ...overrides,
});

export const homeResponse = (overrides: Partial<HomeResponse> = {}): HomeResponse => ({
  recentComments: [recentComment()],
  newProblems: [
    { code: 'hcmus41a', name: 'Dãy số đẹp', points: 100, date: '2026-10-08T01:00:00Z' },
  ],
  topPerformers: [
    {
      username: 'tuanlq',
      displayRank: 'user',
      rating: 2450,
      performancePoints: 8120,
      contributionPoints: 604,
      organization: organizationSummary(),
    },
  ],
  topContributors: [
    {
      username: 'thayhung',
      displayRank: 'admin',
      rating: null,
      performancePoints: 100,
      contributionPoints: 1840,
      organization: null,
    },
  ],
  counts: HOME_COUNTS,
  ...overrides,
});
export const flatpage = (overrides: Partial<Flatpage> = {}): Flatpage => ({
  url: '/about/rules',
  title: 'Quy tắc cộng đồng',
  contentHtml: '<h2>1. Làm bài trung thực</h2><p>Không nộp lời giải chép.</p>',
  registrationRequired: false,
  ...overrides,
});

export const solved = (): SolvedResponse => ({
  groups: [
    {
      name: 'Quy hoạch động',
      points: 140,
      problems: [
        { code: 'dp_knap', name: 'Cái túi', points: 100, total: 100 },
        { code: 'dp_bit', name: 'Quy hoạch trạng thái bitmask', points: 70, total: 100 },
      ],
    },
  ],
});
export const ppEntry = (rank: number, overrides: Partial<PpEntry> = {}): PpEntry => ({
  rank,
  weight: 100 * 0.95 ** (rank - 1),
  points: 100,
  scaledPoints: 100 * 0.95 ** (rank - 1),
  problem: { code: `p${rank}`, name: `Bài ${rank}` },
  submission: {
    id: `sub-${rank}`,
    date: '2026-10-07T03:00:00Z',
    casePoints: 100,
    caseTotal: 100,
    result: 'AC',
    language: 'C++20',
  },
  ...overrides,
});
export const activity = (
  days: Record<string, number> = { '2026-10-07': 2, '2026-10-05': 5 },
): ActivityResponse => ({
  timezone: 'Asia/Ho_Chi_Minh',
  since: '2025-10-08T17:00:00Z',
  days,
});
