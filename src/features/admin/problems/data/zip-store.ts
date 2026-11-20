/**
 * A zip archive of files stored without compression: what the test upload needs to send loose input and output files
 * through the archive endpoint (the API takes only a zip). The repo has no zip library, and test files gain little from
 * deflate next to the cost of a dependency, so this writes the format's plain subset (APPNOTE 6.3.3): one local header
 * and the file's own bytes per entry, the central directory, the end record. No ZIP64: more than `ZIP_MAX_ENTRIES`
 * entries or `ZIP_MAX_BYTES` bytes is refused. The result is a Blob over the given blobs, so no file is copied in memory;
 * each file is read once, for its CRC-32.
 */
export interface ZipEntrySource {
  /** The path inside the archive, `/`-separated. */
  name: string;
  data: Blob;
  modified?: Date;
}

/** One below the format's field maxima: `0xffff` entries and `0xffffffff` bytes are the marks that mean "see ZIP64". */
export const ZIP_MAX_ENTRIES = 0xfffe;
export const ZIP_MAX_BYTES = 0xfffffffe;
/** Thrown when the archive would need ZIP64. */
export const ZIP_TOO_LARGE = 'zip_too_large';

const LOCAL_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_HEADER_SIGNATURE = 0x02014b50;
const END_RECORD_SIGNATURE = 0x06054b50;
const LOCAL_HEADER_BYTES = 30;
const CENTRAL_HEADER_BYTES = 46;
const END_RECORD_BYTES = 22;
/** Version 2.0: the lowest that names folders and the UTF-8 flag's readers all accept. */
const VERSION = 20;
/** General purpose bit 11: the name is UTF-8. */
const UTF8_NAME_FLAG = 0x0800;
const METHOD_STORED = 0;
const DOS_FIRST_YEAR = 1980;
const CRC_POLYNOMIAL = 0xedb88320;

const CRC_TABLE = Uint32Array.from({ length: 256 }, (_unused, byte) => {
  let value = byte;
  for (let bit = 0; bit < 8; bit++)
    value = value & 1 ? (value >>> 1) ^ CRC_POLYNOMIAL : value >>> 1;
  return value >>> 0;
});

/** The running CRC-32 after `bytes`; start from `0xffffffff` and invert the last value. */
function crcStep(crc: number, bytes: Uint8Array): number {
  let value = crc;
  // An indexed loop: a test archive can hold hundreds of megabytes, and the iterator protocol is several times slower.
  for (let index = 0; index < bytes.length; index++)
    value = CRC_TABLE[(value ^ bytes[index]!) & 0xff]! ^ (value >>> 8);
  return value;
}

/** The CRC-32 of bytes held in memory. */
export const crc32 = (bytes: Uint8Array) => (crcStep(0xffffffff, bytes) ^ 0xffffffff) >>> 0;

/** The CRC-32 of a blob, read as a stream so a large file is never held whole. */
async function crc32OfBlob(blob: Blob): Promise<number> {
  const reader = blob.stream().getReader();
  let crc = 0xffffffff;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    crc = crcStep(crc, value);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** MS-DOS time and date words (2-second steps, local time); a year before 1980 is stored as 1980. */
function dosStamp(at: Date): { time: number; date: number } {
  const year = Math.max(at.getFullYear(), DOS_FIRST_YEAR);
  return {
    time: (at.getHours() << 11) | (at.getMinutes() << 5) | (at.getSeconds() >> 1),
    date: ((year - DOS_FIRST_YEAR) << 9) | ((at.getMonth() + 1) << 5) | at.getDate(),
  };
}

interface Entry {
  name: Uint8Array;
  crc: number;
  size: number;
  stamp: { time: number; date: number };
  offset: number;
}

/** The fields the local and the central header share, written from `at`: version to sizes and the name length. */
function writeCommon(view: DataView, at: number, entry: Entry) {
  view.setUint16(at, VERSION, true);
  view.setUint16(at + 2, UTF8_NAME_FLAG, true);
  view.setUint16(at + 4, METHOD_STORED, true);
  view.setUint16(at + 6, entry.stamp.time, true);
  view.setUint16(at + 8, entry.stamp.date, true);
  view.setUint32(at + 10, entry.crc, true);
  view.setUint32(at + 14, entry.size, true);
  view.setUint32(at + 18, entry.size, true);
  view.setUint16(at + 22, entry.name.length, true);
}

function localHeader(entry: Entry): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(LOCAL_HEADER_BYTES + entry.name.length);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, LOCAL_HEADER_SIGNATURE, true);
  writeCommon(view, 4, entry);
  bytes.set(entry.name, LOCAL_HEADER_BYTES);
  return bytes;
}

function centralHeader(entry: Entry): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(CENTRAL_HEADER_BYTES + entry.name.length);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, CENTRAL_HEADER_SIGNATURE, true);
  view.setUint16(4, VERSION, true);
  writeCommon(view, 6, entry);
  view.setUint32(42, entry.offset, true);
  bytes.set(entry.name, CENTRAL_HEADER_BYTES);
  return bytes;
}

function endRecord(count: number, directoryBytes: number, directoryOffset: number) {
  const bytes = new Uint8Array(END_RECORD_BYTES);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, END_RECORD_SIGNATURE, true);
  view.setUint16(8, count, true);
  view.setUint16(10, count, true);
  view.setUint32(12, directoryBytes, true);
  view.setUint32(16, directoryOffset, true);
  return bytes;
}

/** The archive's size for these entries, before any file is read: what `zipStore` will produce. */
export function zipStoreSize(sources: readonly { name: string; size: number }[]): number {
  const encoder = new TextEncoder();
  return sources.reduce(
    (total, source) =>
      total +
      LOCAL_HEADER_BYTES +
      CENTRAL_HEADER_BYTES +
      2 * encoder.encode(source.name).length +
      source.size,
    END_RECORD_BYTES,
  );
}

/** The entries as one stored zip. Throws `RangeError(ZIP_TOO_LARGE)` when the format's plain limits do not hold it. */
export async function zipStore(sources: readonly ZipEntrySource[]): Promise<Blob> {
  const sized = sources.map((source) => ({ name: source.name, size: source.data.size }));
  if (sources.length > ZIP_MAX_ENTRIES || zipStoreSize(sized) > ZIP_MAX_BYTES)
    throw new RangeError(ZIP_TOO_LARGE);
  const encoder = new TextEncoder();
  const now = new Date();
  const parts: BlobPart[] = [];
  const entries: Entry[] = [];
  let offset = 0;
  for (const source of sources) {
    const entry: Entry = {
      name: encoder.encode(source.name),
      crc: await crc32OfBlob(source.data),
      size: source.data.size,
      stamp: dosStamp(source.modified ?? now),
      offset,
    };
    parts.push(localHeader(entry), source.data);
    entries.push(entry);
    offset += LOCAL_HEADER_BYTES + entry.name.length + entry.size;
  }
  const directory = entries.map(centralHeader);
  const directoryBytes = directory.reduce((total, header) => total + header.length, 0);
  parts.push(...directory, endRecord(entries.length, directoryBytes, offset));
  return new Blob(parts, { type: 'application/zip' });
}
