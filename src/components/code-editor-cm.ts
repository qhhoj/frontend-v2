import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView, drawSelection, keymap, lineNumbers } from '@codemirror/view';

export interface EditorOptions {
  doc: string;
  label: string;
  disabled: boolean;
  /** Carried over from the fallback textarea so the caret does not move when the editor takes over. */
  selection?: { anchor: number; head: number };
  onChange(doc: string): void;
}

export interface EditorHandle {
  setDoc(doc: string): void;
  setDisabled(disabled: boolean): void;
  focus(): void;
  destroy(): void;
}

/**
 * Themed only through CSS custom properties, so every theme and palette works unchanged.
 * Font, line height and the horizontal paddings equal the textarea fallback (styles.css `.code-editor-*`),
 * so swapping the two does not move a single line; keep them in step.
 */
const tokenTheme = EditorView.theme({
  '&': {
    color: 'var(--qh-text)',
    backgroundColor: 'transparent',
    fontSize: 'var(--code-font-size)',
  },
  '&.cm-focused': { outline: 'none' }, // the ring is drawn on the wrapper, where overflow cannot clip it
  '.cm-scroller': { fontFamily: 'var(--qh-font-mono)', lineHeight: 'var(--code-line-height)' },
  '.cm-content': { padding: '0', caretColor: 'var(--qh-text)' },
  '.cm-line': { padding: '0 var(--code-inline-padding)' },
  '.cm-gutters': { backgroundColor: 'transparent', color: 'var(--qh-text-muted)', border: 'none' },
  '.cm-lineNumbers .cm-gutterElement': { padding: '0 var(--code-inline-padding)', minWidth: '0' },
  '.cm-selectionBackground, &.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground':
    { backgroundColor: 'var(--qh-accent-soft)' },
});

/** Tab is deliberately not bound (only the default and history keymaps): binding it would trap keyboard users. */
export function createEditor(host: HTMLElement, options: EditorOptions): EditorHandle {
  const editable = new Compartment();
  const view = new EditorView({
    parent: host,
    state: EditorState.create({
      doc: options.doc,
      selection: options.selection,
      extensions: [
        lineNumbers(),
        drawSelection(),
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
