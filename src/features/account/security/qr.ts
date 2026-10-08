import { encode } from 'uqr';

/** The modules of the QR code for `text` (true = dark), error correction M, without the quiet zone (the SVG adds it). Drawn here: the secret never goes to a QR service. */
export const qrModules = (text: string): boolean[][] => encode(text, { ecc: 'M', border: 0 }).data;

/** One SVG path with a 1×1 square per dark module. */
export const qrPath = (modules: ReadonlyArray<readonly boolean[]>): string =>
  modules
    .flatMap((row, rowIndex) =>
      row.flatMap((dark, column) => (dark ? [`M${column} ${rowIndex}h1v1h-1z`] : [])),
    )
    .join('');
