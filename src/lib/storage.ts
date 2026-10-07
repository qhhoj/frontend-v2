/** localStorage can throw (privacy modes, quota); a preference is never worth an error. */
export function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Unavailable storage: the choice lasts for this page only.
  }
}
