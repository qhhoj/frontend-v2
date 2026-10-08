import { describe, expect, it } from 'vitest';
import type { Language } from '@/api/types/problems';
import { scratchLanguage } from '@/test/fixtures';
import { mountComponent } from '@/test/mount';
import FileDropzone from './FileDropzone.vue';

const scratch = (fileSizeLimit = 5) => scratchLanguage({ fileSizeLimit });
const sb3 = (name = 'cat.sb3') => new File(['x'], name);
const mountDropzone = (
  props: { file?: File | null; disabled?: boolean; language?: Language } = {},
) =>
  mountComponent(FileDropzone, {
    props: { language: scratch(), file: null, disabled: false, ...props },
  });

describe('FileDropzone', () => {
  it('accepts the language extension and states the size cap', () => {
    const wrapper = mountDropzone();
    expect(wrapper.get('input').attributes('accept')).toBe('.sb3');
    expect(wrapper.text()).toContain('Chọn tệp .sb3');
    expect(wrapper.text()).toContain('Tối đa 5.0 MB');
  });
  it('emits the first of several dropped files, and nothing for an empty drop', async () => {
    const wrapper = mountDropzone();
    const label = wrapper.get('label');
    await label.trigger('drop', { dataTransfer: { files: [sb3('a.sb3'), sb3('b.sb3')] } });
    expect(wrapper.emitted('choose')).toHaveLength(1);
    expect((wrapper.emitted('choose')![0]![0] as File).name).toBe('a.sb3');
    await label.trigger('drop', { dataTransfer: { files: [] } });
    expect(wrapper.emitted('choose')).toHaveLength(1);
  });
  it('is the static disabled state when uploads are off: no input, no events', () => {
    const wrapper = mountDropzone({ disabled: true, language: scratch(0) });
    expect(wrapper.find('input').exists()).toBe(false);
    expect(wrapper.find('label').exists()).toBe(false);
    expect(wrapper.get('[aria-disabled="true"]').text()).toBe(
      'Ngôn ngữ này không nhận tệp tải lên.',
    );
    expect(wrapper.emitted()).toEqual({});
  });
  it('shows the chosen file with its name and size, and emits remove', async () => {
    const wrapper = mountDropzone({ file: new File(['x'.repeat(2048)], 'catmaze-final.sb3') });
    expect(wrapper.get('[title="catmaze-final.sb3"]').text()).toBe('catmaze-final.sb3');
    expect(wrapper.text()).toContain('2 KB');
    await wrapper.get('button[aria-label="Bỏ tệp"]').trigger('click');
    expect(wrapper.emitted('remove')).toHaveLength(1);
  });
});
