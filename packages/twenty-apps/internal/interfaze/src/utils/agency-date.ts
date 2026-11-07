export const AGENCY_TIME_ZONE = 'Europe/Paris';

const AGENCY_DATE_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: AGENCY_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export const agencyToday = (now: Date): string => {
  const parts = Object.fromEntries(
    AGENCY_DATE_FORMAT.formatToParts(now).map(({ type, value }) => [
      type,
      value,
    ]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
};

export const addDays = (date: string, days: number): string => {
  const shifted = new Date(`${date}T00:00:00.000Z`);

  shifted.setUTCDate(shifted.getUTCDate() + days);

  return shifted.toISOString().slice(0, 10);
};
