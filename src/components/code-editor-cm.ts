import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';

export interface EditorOptions {
  doc: string;
  label: string;
  disabled: boolean;
  onChange(doc: string): void;
}

export interface EditorHandle {
  setDoc(doc: string): void;
  setDisabled(disabled: boolean): void;
  focus(): void;
  destroy(): void;
}

/** Themed only through CSS custom properties, so every theme and palette works unchanged. */
const tokenTheme = EditorView.theme({
  '&': { color: 'var(--qh-text)', backgroundColor: 'transparent', fontSize: '13px' },
  '.cm-content': {
    fontFamily: 'var(--qh-font-mono)',
    lineHeight: '1.65',
    caretColor: 'var(--qh-text)',
  },
  '.cm-gutters': { backgroundColor: 'transparent', color: 'var(--qh-text-muted)', border: 'none' },
  '&.cm-focused': { outline: '2px solid var(--qh-focus-ring)', outlineOffset: '2px' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'var(--qh-accent-soft)',
  },
});

/** Tab is deliberately not bound (only the default and history keymaps): binding it would trap keyboard users. */
export function createEditor(host: HTMLElement, options: EditorOptions): EditorHandle {
  const editable = new Compartment();
  const view = new EditorView({
    parent: host,
    state: EditorState.create({
      doc: options.doc,
      extensions: [
        lineNumbers(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        tokenTheme,
        EditorView.contentAttributes.of({
          'aria-label': options.label,
          spellcheck: 'false',
          autocapitalize: 'off',
        }),
        editable.of(EditorView.editable.of(!options.disabled)),
        EditorView.updateListener.of(
          (update) => update.docChanged && options.onChange(update.state.doc.toString()),
        ),
      ],
    }),
  });
  return {
    setDoc: (doc) =>
      view.state.doc.toString() !== doc &&
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: doc } }),
    setDisabled: (disabled) =>
      view.dispatch({ effects: editable.reconfigure(EditorView.editable.of(!disabled)) }),
    focus: () => view.focus(),
    destroy: () => view.destroy(),
  };
}
