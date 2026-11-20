import { describe, expect, it } from 'vitest';
import { crc32, zipStore, zipStoreSize, ZIP_MAX_ENTRIES, ZIP_TOO_LARGE } from './zip-store';

const text = (value: string) => new TextEncoder().encode(value);
const read = (bytes: Uint8Array, at: number, length: number) =>
  new TextDecoder().decode(bytes.subarray(at, at + length));

/** Reads an archive back the way an unzip tool does: end record, then central directory, then each local header. */
function unzip(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const end = bytes.length - 22;
  expect(view.getUint32(end, true)).toBe(0x06054b50);
  const count = view.getUint16(end + 10, true);
  const directoryBytes = view.getUint32(end + 12, true);
  let at = view.getUint32(end + 16, true);
  expect(at + directoryBytes).toBe(end);
  const files: { name: string; content: Uint8Array; crc: number; flags: number }[] = [];
  for (let index = 0; index < count; index++) {
    expect(view.getUint32(at, true)).toBe(0x02014b50);
    const nameLength = view.getUint16(at + 28, true);
    const size = view.getUint32(at + 24, true);
    const local = view.getUint32(at + 42, true);
    const name = read(bytes, at + 46, nameLength);
    expect(view.getUint32(local, true)).toBe(0x04034b50);
    expect(view.getUint16(local + 8, true)).toBe(0);
    expect(view.getUint32(local + 18, true)).toBe(size);
    expect(view.getUint32(local + 22, true)).toBe(size);
    expect(read(bytes, local + 30, view.getUint16(local + 26, true))).toBe(name);
    expect(view.getUint32(local + 14, true)).toBe(view.getUint32(at + 16, true));
    const start = local + 30 + nameLength;
    files.push({
      name,
      content: bytes.slice(start, start + size),
      crc: view.getUint32(at + 16, true),
      flags: view.getUint16(at + 8, true),
    });
    at += 46 + nameLength;
  }
  expect(at).toBe(end);
  return files;
}

describe('zipStore', () => {
  it('computes the CRC-32 of the standard check value', () => {
    expect(crc32(text('123456789'))).toBe(0xcbf43926);
    expect(crc32(new Uint8Array())).toBe(0);
  });

  it('stores every file under its name with its bytes, CRC and the UTF-8 flag', async () => {
    const sources = [
      { name: '1.inp', data: new Blob(['3\n1 2 3\n']) },
      { name: '1.out', data: new Blob(['6\n']) },
      { name: 'nhóm 2/đề.inp', data: new Blob([]) },
    ];
    const zip = await zipStore(sources);
    const bytes = new Uint8Array(await zip.arrayBuffer());
    expect(bytes.length).toBe(
      zipStoreSize(sources.map((source) => ({ name: source.name, size: source.data.size }))),
    );
    const files = unzip(bytes);
    expect(files.map((file) => file.name)).toEqual(sources.map((source) => source.name));
    expect(read(files[0]!.content, 0, files[0]!.content.length)).toBe('3\n1 2 3\n');
    expect(files[1]!.crc).toBe(crc32(text('6\n')));
    expect(files[2]!.content.length).toBe(0);
    expect(files.every((file) => file.flags === 0x0800)).toBe(true);
  });

  it('writes an empty archive as a lone end record', async () => {
    const bytes = new Uint8Array(await (await zipStore([])).arrayBuffer());
    expect(bytes.length).toBe(22);
    expect(unzip(bytes)).toEqual([]);
  });

  it('refuses more entries than the format holds without ZIP64', async () => {
    const empty = new Blob([]);
    const sources = Array.from({ length: ZIP_MAX_ENTRIES + 1 }, (_unused, index) => ({
      name: String(index),
      data: empty,
    }));
    await expect(zipStore(sources)).rejects.toThrow(ZIP_TOO_LARGE);
  });
});
