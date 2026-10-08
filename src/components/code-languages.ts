import type { Extension } from '@codemirror/state';

const PACKS: Record<string, () => Promise<Extension>> = {
  c_cpp: async () => (await import('@codemirror/lang-cpp')).cpp(),
  python: async () => (await import('@codemirror/lang-python')).python(),
  java: async () => (await import('@codemirror/lang-java')).java(),
  javascript: async () => (await import('@codemirror/lang-javascript')).javascript(),
  rust: async () => (await import('@codemirror/lang-rust')).rust(),
  golang: async () => (await import('@codemirror/lang-go')).go(),
};

/** `null` means plain text: no pack for this language (Pascal, `text` and others) or its chunk failed to load. The keys are the legacy ace modes; the backend test fixtures confirm `c_cpp`, `python`, `text`, the rest is checked against `/problems/meta` at cutover. */
export async function loadLanguagePack(ace: string): Promise<Extension | null> {
  if (!Object.hasOwn(PACKS, ace)) return null;
  try {
    return await PACKS[ace]!();
  } catch {
    return null;
  }
}
