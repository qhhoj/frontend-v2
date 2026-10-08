import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mountComponent } from '@/test/mount';
import CodeEditor from './CodeEditor.vue';

interface FakeHandle {
  setDoc: ReturnType<typeof vi.fn>;
  setDisabled: ReturnType<typeof vi.fn>;
  focus: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
}

interface FakeOptions {
  doc: string;
  label: string;
  disabled: boolean;
  selection?: { anchor: number; head: number };
  onChange(doc: string): void;
}

const fake = vi.hoisted(() => ({
  createdCount: 0,
  options: undefined as FakeOptions | undefined,
  handle: undefined as FakeHandle | undefined,
}));

vi.mock('./code-editor-cm', () => ({
  createEditor: (_host: HTMLElement, options: FakeOptions) => {
    fake.createdCount += 1;
    fake.options = options;
    fake.handle = {
      setDoc: vi.fn(),
      setDisabled: vi.fn(),
      focus: vi.fn(),
      destroy: vi.fn(),
    };
    return fake.handle;
  },
}));

const options = () => fake.options as FakeOptions;
const handle = () => fake.handle as FakeHandle;

const mountEditor = (props: Record<string, unknown> = {}) =>
  mountComponent(CodeEditor, {
    props: { modelValue: 'int main() {}', label: 'Source code', ...props },
  }) as unknown as VueWrapper<{ modelValue: string; disabled: boolean }>;

describe('CodeEditor', () => {
  beforeEach(() => {
    fake.createdCount = 0;
    fake.options = undefined;
    fake.handle = undefined;
  });

  it('shows a labelled textarea mirroring the value, with a line-number gutter, before the editor loads', () => {
    const editor = mountEditor({ modelValue: 'a\nb\nc', minLines: 1 });
    const textarea = editor.get('textarea');
    expect(textarea.attributes('aria-label')).toBe('Source code');
    expect((textarea.element as HTMLTextAreaElement).value).toBe('a\nb\nc');
    const gutter = editor.get('[aria-hidden="true"]');
    expect(gutter.findAll('span').map((line) => line.text())).toEqual(['1', '2', '3']);
  });

  it('swaps the textarea for the editor once loaded and emits what the editor reports', async () => {
    const editor = mountEditor();
    await flushPromises();
    expect(editor.find('textarea').exists()).toBe(false);
    expect(options().doc).toBe('int main() {}');
    expect(options().label).toBe('Source code');
    options().onChange('return 0;');
    expect(editor.emitted('update:modelValue')).toEqual([['return 0;']]);
  });

  it('pushes an external value into the editor once, without echoing it back', async () => {
    const editor = mountEditor();
    await flushPromises();
    // A real setDoc notifies the change listener synchronously; report a normalised doc so a leak would differ from the prop.
    handle().setDoc.mockImplementation((doc: string) => options().onChange(`${doc}\n`));
    await editor.setProps({ modelValue: '#include <bits>' });
    expect(handle().setDoc).toHaveBeenCalledExactlyOnceWith('#include <bits>');
    expect(editor.emitted('update:modelValue')).toBeUndefined();
  });

  it('forwards the disabled flag to the editor', async () => {
    const editor = mountEditor();
    await flushPromises();
    await editor.setProps({ disabled: true });
    expect(handle().setDisabled).toHaveBeenLastCalledWith(true);
  });

  it('destroys the editor on unmount', async () => {
    const editor = mountEditor();
    await flushPromises();
    editor.unmount();
    expect(handle().destroy).toHaveBeenCalledOnce();
  });

  it('passes text typed before the editor loaded as its document', async () => {
    const editor = mountEditor({ modelValue: '' });
    await editor.get('textarea').setValue('typed early');
    await editor.setProps({ modelValue: 'typed early' });
    await flushPromises();
    expect(options().doc).toBe('typed early');
  });

  it('hands focus and the caret over from the textarea to the editor', async () => {
    const editor = mountEditor({ modelValue: 'hello world' });
    const textarea = editor.get('textarea').element as HTMLTextAreaElement;
    textarea.focus();
    textarea.setSelectionRange(2, 7);
    await flushPromises();
    expect(options().selection).toEqual({ anchor: 2, head: 7 });
    expect(handle().focus).toHaveBeenCalledOnce();
  });

  it('does not steal focus when the textarea was not focused', async () => {
    mountEditor();
    await flushPromises();
    expect(options().selection).toBeUndefined();
    expect(handle().focus).not.toHaveBeenCalled();
  });

  it('creates no editor when the component unmounts before the chunk arrives', async () => {
    const editor = mountEditor();
    editor.unmount();
    await flushPromises();
    expect(fake.createdCount).toBe(0);
  });

  it('warns once and keeps a working textarea when the chunk fails to load', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.doMock('./code-editor-cm', () => {
      throw new Error('chunk failed');
    });
    vi.resetModules();
    const { default: FreshEditor } = await import('./CodeEditor.vue');
    const editor = mountComponent(FreshEditor, {
      props: { modelValue: 'x', label: 'Source code' },
    });
    await flushPromises();
    expect(warn).toHaveBeenCalledExactlyOnceWith('code editor failed to load', expect.any(Error));
    await editor.get('textarea').setValue('typed');
    expect(editor.emitted('update:modelValue')).toEqual([['typed']]);
    vi.doUnmock('./code-editor-cm');
    warn.mockRestore();
  });
});
