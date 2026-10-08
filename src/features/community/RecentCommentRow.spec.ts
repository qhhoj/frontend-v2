import { beforeEach, describe, expect, it } from 'vitest';
import { recentComment } from '@/test/community-fixtures';
import { mockApi } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import RecentCommentRow from './RecentCommentRow.vue';

beforeEach(() => mockApi({ ...anonymousViewer }));
const NOW = Date.parse('2026-10-08T10:12:00Z');

describe('RecentCommentRow', () => {
  it('links the page title to the comment itself and shows age and signed score', () => {
    const comment = recentComment({ score: 4 });
    const row = mountComponent(RecentCommentRow, { props: { comment, now: NOW } });
    const link = row.get('a[href*="#comment-"]');
    expect(link.text()).toBe('Editorial QHH Round #11');
    expect(link.attributes('href')).toBe(`/blog/${comment.page.key}#comment-${comment.id}`);
    expect(row.text()).toContain('12 phút trước · +4');
  });
  it('names a deleted account without linking anywhere and keeps a tag problem title as text', () => {
    const row = mountComponent(RecentCommentRow, {
      props: {
        comment: recentComment({
          author: null,
          score: -3,
          page: { type: 'tagProblem', key: 'x', title: 'Thẻ' },
        }),
        now: NOW,
      },
    });
    expect(row.text()).toContain('Tài khoản đã xóa');
    expect(row.text()).toContain('−3');
    expect(row.findAll('a')).toHaveLength(0);
  });
});
