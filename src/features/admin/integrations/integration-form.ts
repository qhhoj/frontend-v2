import type { IntegrationScope } from '@/api/types/integration-clients';

/** The CIDR box: one block per line (commas and spaces also split); empty lines dropped. The backend parses each block. */
export const cidrLines = (text: string): string[] =>
  text
    .split(/[\s,]+/)
    .map((line) => line.trim())
    .filter((line) => line !== '');

/** The message key of each scope's human text (no colon in a message key). */
export const SCOPE_KEYS: Record<IntegrationScope, string> = {
  'contests:write': 'contestsWrite',
  'contests:read': 'contestsRead',
};
