import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import { mountComponent } from '@/test/mount';
import type { StatementDraft, StatementSlot } from './statement-drafts';
import { useImageInsert } from './use-image-insert';

const upload = vi.hoisted(() => ({ answer: null as null | ((url: string) => void) }));
vi.mock('@/api/problem-editing.api', () => ({
  /** The upload answers when the test says so: the viewer may switch language before it does. */
  uploadProblemImage: () =>
    new Promise<string>((resolve) => {
      upload.answer = resolve;
    }),
}));

const draft = (description: string): StatementDraft => ({
  name: 'Tên',
  description,
  exists: true,
  storedDescription: description,
});

describe('useImageInsert', () => {
  it('puts the image into the language the upload started in, even when the viewer switched meanwhile', async () => {
    const drafts = ref<Record<StatementSlot, StatementDraft>>({
      vi: draft('Tiếng Việt'),
      en: draft('English'),
      original: draft('Gốc'),
    });
    const slot = ref<StatementSlot>('vi');
    let imageUpload!: ReturnType<typeof useImageInsert>;
    mountComponent(
      defineComponent({
        setup() {
          imageUpload = useImageInsert(drafts, slot, () => undefined);
          return () => h('div');
        },
      }),
    );
    void imageUpload.upload(new File(['x'], 'a.png'));
    slot.value = 'en';
    upload.answer?.('/media/a.png');
    await flushPromises();
    expect(drafts.value.vi.description).toContain('![](/media/a.png)');
    expect(drafts.value.en.description).toBe('English');
  });
});
