import { describe, expect, it } from 'vitest';
import { routeUpload, sortDropped } from './test-upload';

const zip = new File(['x'], 'tests.zip');

describe('routeUpload', () => {
  it('sends a zip at once when no archive is stored', () => {
    expect(sortDropped([zip]).kind).toBe('zip');
    expect(routeUpload(false)).toBe('send');
  });

  it('holds a zip until the teacher confirms when an archive is stored', () => {
    expect(sortDropped([zip]).kind).toBe('zip');
    expect(routeUpload(true)).toBe('wait');
  });
});
