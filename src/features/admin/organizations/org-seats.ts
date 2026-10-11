/** Members against seats (`184 / 200`), or the member count alone when seats are unlimited. */
export const seatsText = (
  organization: { memberCount: number; slots: number | null },
  format: (value: number) => string,
): string =>
  organization.slots === null
    ? format(organization.memberCount)
    : `${format(organization.memberCount)} / ${format(organization.slots)}`;
