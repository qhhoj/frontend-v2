import { EditorView } from '@codemirror/view';
import { afterEach, expect, it } from 'vitest';
import { createEditor } from './code-editor-cm';
import type { EditorHandle } from './code-editor-cm';
import { loadLanguagePack } from './code-languages';

let handle: EditorHandle | undefined;
afterEach(() => handle?.destroy());

function mountEditor(doc: string, selection: { anchor: number; head: number }) {
  const host = document.createElement('div');
  document.body.append(host);
  handle = createEditor(host, {
    doc,
    label: 'Source code',
    disabled: false,
    selection,
    onChange: () => undefined,
  });
  return EditorView.findFromDOM(host)!;
}

it('keeps the document and the cursor when the language changes', async () => {
  const view = mountEditor('int main() {}', { anchor: 4, head: 8 });
  handle!.setLanguage(await loadLanguagePack('c_cpp'));
  handle!.setLanguage(await loadLanguagePack('python'));
  handle!.setLanguage(null);
  expect(view.state.doc.toString()).toBe('int main() {}');
  expect(view.state.selection.main).toMatchObject({ anchor: 4, head: 8 });
});
