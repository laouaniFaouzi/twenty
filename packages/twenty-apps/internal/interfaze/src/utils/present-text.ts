// Twenty stores an empty text field as '', even when the field is nullable.
export const presentText = (value: string | null | undefined): string | null =>
  value === undefined || value === '' ? null : value;
