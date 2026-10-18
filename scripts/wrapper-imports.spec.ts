import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs module without types
import { WRAPPER_IMPORT_PATTERNS, WRAPPER_IMPORTERS } from './wrapper-imports.mjs';

const patterns = (WRAPPER_IMPORT_PATTERNS as Array<{ regex: string }>).map(
  ({ regex }) => new RegExp(regex),
);
const isWrapperPath = (path: string) => patterns.some((pattern) => pattern.test(path));
const IMPORT_PATH = /(?:from|import)\s+(['"])(.+?)\1/g;
const importPaths = (source: string) => [...source.matchAll(IMPORT_PATH)].map((match) => match[2]);

describe('wrapper import patterns', () => {
  it.each([
    '@/components/GlassCard.vue',
    '../../ui/AdminField.vue',
    './AdminChip.vue',
    '@/features/admin/ui/AdminPageHeader.vue',
    '../ui/table/AdminDataTable.vue',
    '../../ui/feedback/AdminNotice.vue',
    '@/features/admin/ui/controls',
    '../controls',
    './controls',
  ])('forbid %s', (path) => {
    expect(isWrapperPath(path)).toBe(true);
  });

  it.each([
    '@/components/ui/Card.vue',
    '@/components/ui/FormField.vue',
    '@/components/ui/DataTable.vue',
    '../ui/AdminSwitch.vue',
    '../ui/AdminFieldNote.vue',
    '@/features/settings/buttons',
    './use-controls',
  ])('allow %s', (path) => {
    expect(isWrapperPath(path)).toBe(false);
  });
});

describe('the allow-list of wrapper importers', () => {
  it('names only files that exist and still import a wrapper, so a migrated file must leave it', () => {
    const stale = (WRAPPER_IMPORTERS as string[]).filter(
      (file) => !existsSync(file) || !importPaths(readFileSync(file, 'utf8')).some(isWrapperPath),
    );
    expect(stale).toEqual([]);
  });
});
