import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
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
  createError: undefined as Error | undefined,
  options: undefined as FakeOptions | undefined,
  handle: undefined as FakeHandle | undefined,
}));

vi.mock('./code-editor-cm', () => ({
  createEditor: (_host: HTMLElement, options: FakeOptions) => {
    if (fake.createError) throw fake.createError;
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
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    fake.createdCount = 0;
    fake.createError = undefined;
    fake.options = undefined;
    fake.handle = undefined;
  });

  afterEach(() => {
    warn.mockRestore();
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

  it('brings the textarea back with the current text when creating the editor throws', async () => {
    fake.createError = new Error('boom');
    const editor = mountEditor({ modelValue: 'current text' });
    await flushPromises();
    expect(warn).toHaveBeenCalledExactlyOnceWith('code editor failed to load', fake.createError);
    const textarea = editor.get('textarea');
    expect((textarea.element as HTMLTextAreaElement).value).toBe('current text');
    await textarea.setValue('typed');
    expect(editor.emitted('update:modelValue')).toEqual([['typed']]);
  });

  it('keeps the anchor and head of a backward selection', async () => {
    const editor = mountEditor({ modelValue: 'hello world' });
    const textarea = editor.get('textarea').element as HTMLTextAreaElement;
    textarea.focus();
    textarea.setSelectionRange(2, 7, 'backward');
    await flushPromises();
    expect(options().selection).toEqual({ anchor: 7, head: 2 });
  });
});
