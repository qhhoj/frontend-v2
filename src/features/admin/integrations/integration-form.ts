/** The CIDR box: one block per line (commas and spaces also split); empty lines dropped. The backend parses each block. */
export const cidrLines = (text: string): string[] =>
  text
    .split(/[\s,]+/)
    .map((line) => line.trim())
    .filter((line) => line !== '');
