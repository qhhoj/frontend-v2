const MIB = 1024 * 1024;

/** Backend P4/P5 caps; checked here so a too-large file is never sent. The archive's is the chunked upload's (2 GiB). */
export const UPLOAD_LIMITS = {
  archive: 2048 * MIB,
  polygonPackage: 512 * MIB,
  statementPdf: 5 * MIB,
  material: 20 * MIB,
} as const;

export const tooLargeFor = (file: Pick<File, 'size'>, limit: number) => file.size > limit;
