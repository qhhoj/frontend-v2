import { describe, expect, it } from 'vitest';
import { postItem } from '@/test/community-fixtures';
import { mockApi } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import PostCard from './PostCard.vue';
import PostCardSkeleton from './PostCardSkeleton.vue';
import PostRow from './PostRow.vue';
import PostRowSkeleton from './PostRowSkeleton.vue';

const row = () => mountComponent(PostRow, { props: { post: postItem() } });
const card = () => mountComponent(PostCard, { props: { post: postItem({ sticky: true }) } });

describe('post row skeleton parity', () => {
  it('shares the row grid and padding', () => {
    mockApi({ ...anonymousViewer });
    const shared = ['grid', 'grid-cols-[minmax(0,1fr)_auto]', 'gap-x-3', 'px-4', 'py-2', 'sm:px-5'];
    expect(row().classes()).toEqual(expect.arrayContaining(shared));
    expect(mountComponent(PostRowSkeleton).classes()).toEqual(expect.arrayContaining(shared));
  });
  it('reserves the 44 px vote on the right', () => {
    mockApi({ ...anonymousViewer });
    expect(row().get('button[aria-label="Bình chọn lên"]').classes()).toContain('size-11');
    expect(mountComponent(PostRowSkeleton).get('[data-part="vote"]').classes()).toContain('h-11');
  });
});

describe('post card skeleton parity', () => {
  it('shares the glass card box and the 144 px image area', () => {
    mockApi({ ...anonymousViewer });
    const skeleton = mountComponent(PostCardSkeleton);
    for (const box of [card(), skeleton]) {
      expect(box.classes()).toEqual(expect.arrayContaining(['glass', 'flex', 'flex-col']));
    }
    skeleton.get('.h-36');
    card().get('a.h-36');
  });
});
