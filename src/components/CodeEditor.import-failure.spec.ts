import { flushPromises } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { mountComponent } from '@/test/mount';
import CodeEditor from './CodeEditor.vue';

vi.mock('./code-editor-cm', () => {
  throw new Error('chunk failed');
});

afterEach(() => vi.restoreAllMocks());

it('warns once and keeps a working textarea when the chunk fails to load', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const editor = mountComponent(CodeEditor, {
    props: { modelValue: 'x', label: 'Source code' },
  });
  await flushPromises();
  expect(warn).toHaveBeenCalledExactlyOnceWith('code editor failed to load', expect.any(Error));
  await editor.get('textarea').setValue('typed');
  expect(editor.emitted('update:modelValue')).toEqual([['typed']]);
});
