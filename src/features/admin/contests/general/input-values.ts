/** A number box that may be cleared: '' is null (the PATCH meaning of "unset"), not 0. */
export const nullableNumber = (raw: string): number | null => (raw === '' ? null : Number(raw));

/** A number box for a field the backend refuses null: '' stays NaN, which the form check reports. */
export const numberOrNaN = (raw: string): number => (raw === '' ? Number.NaN : Number(raw));

export const textOf = (event: Event): string => (event.target as HTMLInputElement).value;
