/** Web storage can throw (privacy modes, quota); a preference is never worth an error. `session` is per browser session. */
type Area = 'local' | 'session';
const storageOf = (area: Area) => (area === 'session' ? sessionStorage : localStorage);

export function readStorage(key: string, area: Area = 'local'): string | null {
  try {
    return storageOf(area).getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string, area: Area = 'local'): void {
  try {
    storageOf(area).setItem(key, value);
  } catch {
    // Unavailable storage: the choice lasts for this page only.
  }
}
