import { UPLOAD_LIMITS } from '../../ui/upload-limits';
import { ZIP_MAX_BYTES, ZIP_MAX_ENTRIES, zipStoreSize } from './zip-store';

/** The name of the archive made in the browser from loose files. */
export const LOOSE_ARCHIVE_NAME = 'tests.zip';

/** Why a set of dropped or picked files is not sent; `name` is the file the reason is about. */
export interface DropRefusal {
  reason: 'empty' | 'mixed' | 'duplicate' | 'tooMany' | 'tooLarge' | 'folder' | 'unreadable';
  name?: string;
}

/** What a set of files is for the test upload: the one archive, loose test files to pack, or nothing that can be sent. */
export type Dropped =
  | { kind: 'zip'; file: File }
  | { kind: 'loose'; files: File[] }
  | ({ kind: 'refused' } & DropRefusal);

const isZip = (file: File) => file.name.toLowerCase().endsWith('.zip');
const refused = (reason: DropRefusal['reason'], name?: string): Dropped => ({
  kind: 'refused',
  reason,
  name,
});

/** The first name that two of the files share: they would be one entry of the archive. */
function repeatedName(files: readonly File[]): string | undefined {
  const seen = new Set<string>();
  for (const file of files) {
    if (seen.has(file.name)) return file.name;
    seen.add(file.name);
  }
  return undefined;
}

/**
 * Sorts what was dropped: one `.zip` alone is the archive; files with no `.zip` among them are loose test files; a `.zip`
 * with anything else is refused (which of them is meant is a guess). Loose files must have distinct names and fit the
 * plain zip format and the server's archive limit once packed.
 */
export function sortDropped(files: readonly File[]): Dropped {
  if (files.length === 0) return refused('empty');
  const zips = files.filter(isZip);
  if (zips.length === 1 && files.length === 1) {
    const [file] = zips as [File];
    return file.size > UPLOAD_LIMITS.archive
      ? refused('tooLarge', file.name)
      : { kind: 'zip', file };
  }
  if (zips.length > 0) return refused('mixed');
  const repeated = repeatedName(files);
  if (repeated !== undefined) return refused('duplicate', repeated);
  if (files.length > ZIP_MAX_ENTRIES) return refused('tooMany');
  if (zipStoreSize(files) > Math.min(UPLOAD_LIMITS.archive, ZIP_MAX_BYTES))
    return refused('tooLarge');
  return { kind: 'loose', files: [...files] };
}
