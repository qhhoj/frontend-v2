import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { sessionUser } from '@/test/fixtures';
import { comment, commentDetail, commentThreadPage, postDetail } from '@/test/community-fixtures';
import { postRoutes } from '@/test/community-routes';
import { mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { signedInViewer } from '@/test/problem-routes';

const ADMIN = sessionUser({ username: 'admin', isSuperuser: true });
const pageUrl = `/comments/pages/blog/${postDetail().id}`;

/** The post's comment page, served hidden once the moderator's hide landed. */
function hideRoutes() {
  let isHidden = false;
  const shown = () =>
    comment({
      hidden: isHidden,
      hiddenBy: isHidden ? { id: ADMIN.id, username: ADMIN.username, rating: null } : null,
    });
  return {
    ...signedInViewer({ user: ADMIN }),
    ...postRoutes(),
    [`GET ${pageUrl}`]: () => ok(commentThreadPage({ comments: [shown()] })),
    [`POST /comments/${comment().id}/hidden`]: () => {
      isHidden = true;
      return ok(commentDetail(shown()));
    },
  };
}

describe('comments: hide', () => {
  it('closes the confirm and shows the card as hidden, with Unhide, once the hide lands', async () => {
    const calls = mockApi(hideRoutes());
    const { wrapper } = await mountApp(`/blog/${postDetail().id}`);
    const card = () => wrapper.get(`#comment-${comment().id}`);
    await card()
      .findAll('button')
      .find((button) => button.text() === 'Ẩn')!
      .trigger('click');
    await flushPromises();
    const dialog = () => document.body.querySelector('[role="dialog"]');
    dialog()!.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await flushPromises();

    expect(calls.filter((call) => call.method === 'POST').map((call) => call.body)).toEqual([
      { hidden: true },
    ]);
    expect(dialog()?.textContent ?? '').not.toContain('Không ẩn được bình luận');
    const confirm = wrapper
      .findAllComponents(ConfirmDialog)
      .find((found) => found.props('confirmLabel') === 'Ẩn bình luận')!;
    expect(confirm.props('visible')).toBe(false);
    expect(card().find('[data-testid="comment-hidden-badge"]').exists()).toBe(true);
    expect(card().get('[data-testid="comment-hidden-notice"]').text()).toBe(
      'Người dùng không thấy bình luận này; chỉ người kiểm duyệt thấy.',
    );
    expect(card().text()).toContain('bởi admin');
    expect(
      card()
        .findAll('button')
        .map((button) => button.text()),
    ).toContain('Bỏ ẩn');
  });
});
