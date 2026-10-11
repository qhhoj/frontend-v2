import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { useLowPowerPainted } from '@/lib/use-low-power-painted';
import { mountComponent } from '@/test/mount';
import CodeEditor from './CodeEditor.vue';

interface FakeHandle {
  setDoc: ReturnType<typeof vi.fn>;
  setDisabled: ReturnType<typeof vi.fn>;
  setLanguage: ReturnType<typeof vi.fn>;
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
      setLanguage: vi.fn(),
      focus: vi.fn(),
      destroy: vi.fn(),
    };
    return fake.handle;
  },
}));

const packs = vi.hoisted(() => ({
  load: undefined as undefined | ((ace: string) => Promise<unknown>),
}));
vi.mock('./code-languages', () => ({
  loadLanguagePack: (ace: string) => packs.load!(ace),
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
    packs.load = (ace) => Promise.resolve(ace === 'text' ? null : { pack: ace });
  });

  afterEach(() => {
    warn.mockRestore();
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

  describe('language', () => {
    it('drops an older, slower pack that arrives after the language changed', async () => {
      let resolveSlowPython: (pack: unknown) => void = () => undefined;
      const slowPython = new Promise((resolve) => (resolveSlowPython = resolve));
      packs.load = (ace) => (ace === 'python' ? slowPython : Promise.resolve({ pack: ace }));
      const editor = mountEditor({ language: 'python' });
      await flushPromises();
      await editor.setProps({ language: 'c_cpp' });
      await flushPromises();
      resolveSlowPython({ pack: 'python' });
      await flushPromises();
      expect(handle().setLanguage).toHaveBeenLastCalledWith({ pack: 'c_cpp' });
      expect(handle().setLanguage).not.toHaveBeenCalledWith({ pack: 'python' });
    });

    it.each([[null], ['text']])(
      'shows plain text for language %s and keeps working',
      async (language) => {
        const editor = mountEditor({ language });
        await flushPromises();
        expect(handle().setLanguage).toHaveBeenLastCalledWith(null);
        options().onChange('still typing');
        expect(editor.emitted('update:modelValue')).toEqual([['still typing']]);
      },
    );

    it('stays plain text, without an error, when the pack failed to load', async () => {
      packs.load = () => Promise.resolve(null);
      mountEditor({ language: 'c_cpp' });
      await flushPromises();
      expect(handle().setLanguage).toHaveBeenLastCalledWith(null);
      expect(warn).not.toHaveBeenCalled();
    });
  });
});

describe('CodeEditor in low-power mode', () => {
  const turnLowPowerOn = async () => {
    document.documentElement.dataset.lowPower = '';
    await vi.waitFor(() => expect(useLowPowerPainted().value).toBe(true));
  };
  const keydown = (wrapper: ReturnType<typeof mountEditor>, init: KeyboardEventInit) => {
    const event = new KeyboardEvent('keydown', { ...init, bubbles: true, cancelable: true });
    wrapper.get('textarea').element.dispatchEvent(event);
    return event;
  };

  it('keeps the textarea and never loads the editor', async () => {
    await turnLowPowerOn();
    const before = fake.createdCount;
    const wrapper = mountEditor();
    await flushPromises();
    expect(fake.createdCount).toBe(before);
    expect(wrapper.find('textarea').exists()).toBe(true);
    expect(wrapper.get('[data-testid="editor-tab-hint"]').text()).toContain('Esc rồi Tab');
    expect(wrapper.get('textarea').attributes('aria-describedby')).toBe(
      wrapper.get('[data-testid="editor-tab-hint"]').attributes('id'),
    );
  });

  it('indents with Tab, and lets Tab leave after Escape', async () => {
    await turnLowPowerOn();
    const wrapper = mountEditor();
    await flushPromises();
    const field = wrapper.get('textarea').element as HTMLTextAreaElement;
    field.setSelectionRange(3, 3);
    expect(keydown(wrapper, { key: 'Tab' }).defaultPrevented).toBe(true);
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['int     main() {}']);
    keydown(wrapper, { key: 'Escape' });
    expect(keydown(wrapper, { key: 'Tab' }).defaultPrevented).toBe(false);
    expect(keydown(wrapper, { key: 'Tab' }).defaultPrevented).toBe(true);
  });

  it('keeps the Escape release through a modifier key (Shift+Tab still leaves)', async () => {
    await turnLowPowerOn();
    const wrapper = mountEditor();
    await flushPromises();
    keydown(wrapper, { key: 'Escape' });
    keydown(wrapper, { key: 'Shift' });
    expect(keydown(wrapper, { key: 'Tab', shiftKey: true }).defaultPrevented).toBe(false);
  });

  it('swaps to the textarea when low-power turns on, keeping the text', async () => {
    const wrapper = mountEditor();
    await flushPromises();
    const created = handle();
    await turnLowPowerOn();
    await flushPromises();
    expect(created.destroy).toHaveBeenCalled();
    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('int main() {}');
  });
});
