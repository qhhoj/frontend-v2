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
});
