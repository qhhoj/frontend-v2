import { describe, expect, it } from 'vitest';
import { mountComponent } from '@/test/mount';
import AdminSaveBar from './AdminSaveBar.vue';

describe('AdminSaveBar', () => {
  it('sticks to the page bottom by default', () => {
    const bar = mountComponent(AdminSaveBar, { props: { dirtyCount: 1 } });
    expect(bar.classes()).toContain('sticky');
  });

  it('in a drawer footer drops the sticky frame and leaves the page scroll padding alone', () => {
    document.documentElement.style.scrollPaddingBottom = '';
    const bar = mountComponent(AdminSaveBar, { props: { dirtyCount: 1, variant: 'footer' } });
    expect(bar.classes()).not.toContain('sticky');
    expect(bar.classes()).not.toContain('border-t');
    expect(document.documentElement.style.scrollPaddingBottom).toBe('');
  });
});
