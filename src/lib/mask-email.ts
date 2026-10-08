/** How the check-your-email and reset boards show an address: its first character, `***`, then the domain. */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  return at < 1 ? email : `${email[0]}***${email.slice(at)}`;
}
