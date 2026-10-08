import { describe, expect, it } from 'vitest';
import { postItem } from '@/test/community-fixtures';
import { mockApi } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import PostRow from './PostRow.vue';
import PostRowSkeleton from './PostRowSkeleton.vue';

const loaded = () => mountComponent(PostRow, { props: { post: postItem({ sticky: true }) } });
const skeleton = () => mountComponent(PostRowSkeleton);

describe('post row skeleton parity', () => {
  it('shares the row box: 16 px gap, 16 px and 20 px sides and 16 px top and bottom padding', () => {
    mockApi({ ...anonymousViewer });
    expect(loaded().classes()).toEqual(
      expect.arrayContaining(['flex', 'gap-3', 'px-4', 'py-4', 'sm:px-5']),
    );
    expect(skeleton().classes()).toEqual(
      expect.arrayContaining(['flex', 'gap-3', 'px-4', 'py-4', 'sm:px-5']),
    );
  });
  it('gives the vote column the 44 px arrows, 2 px gaps and a 24 px score line', () => {
    mockApi({ ...anonymousViewer });
    const upArrow = loaded().get('button[aria-label="Bình chọn lên"]');
    expect(upArrow.classes()).toContain('size-11');
    expect(upArrow.element.parentElement!.classList).toContain('gap-0.5');
    expect(skeleton().get('[data-part="vote"]').classes()).toEqual(
      expect.arrayContaining(['w-11', 'shrink-0', 'gap-0.5']),
    );
    expect(skeleton().get('[data-part="vote"]').element.querySelectorAll('.size-11')).toHaveLength(
      2,
    );
  });
  it('reserves the same title, summary and footer heights as the loaded row', () => {
    mockApi({ ...anonymousViewer });
    expect(loaded().get('h2').classes()).toContain('min-h-14');
    expect(loaded().get('.user-content, [class~="line-clamp-3"]').classes()).toContain('min-h-18');
    expect(loaded().get('footer').classes()).toContain('min-h-5');
    expect(skeleton().get('[data-part="title"]').classes()).toContain('h-14');
    expect(skeleton().get('[data-part="summary"]').classes()).toContain('h-18');
    expect(skeleton().get('[data-part="footer"]').classes()).toContain('h-5');
  });
});
