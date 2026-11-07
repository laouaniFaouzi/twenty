import { describe, expect, it } from 'vitest';

import { addDays, agencyToday } from 'src/utils/agency-date';

describe('agencyToday', () => {
  it('reads the date in Paris, already the next day late in the UTC evening', () => {
    expect(agencyToday(new Date('2026-03-28T23:30:00Z'))).toBe('2026-03-29');
  });

  it('reads the same date during the day', () => {
    expect(agencyToday(new Date('2026-11-07T10:00:00Z'))).toBe('2026-11-07');
  });
});

describe('addDays', () => {
  it.each([
    ['2026-12-20', 30, '2027-01-19'],
    ['2028-02-28', 1, '2028-02-29'],
    ['2026-11-07', -3, '2026-11-04'],
  ])('adds to %s %i days', (date, days, expected) => {
    expect(addDays(date, days)).toBe(expected);
  });
});
