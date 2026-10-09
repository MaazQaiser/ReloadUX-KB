// Dates are stored as UTC midnight, so format in UTC or they shift a day west of Greenwich.
const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** "14 Mar 2025" */
export function formatDate(date: Date): string {
  return DATE.format(date);
}

export function formatYear(date: Date): number {
  return date.getUTCFullYear();
}

/** "1 week", "19 weeks", "2.5 weeks" */
export function formatWeeks(weeks: number): string {
  return `${weeks} ${weeks === 1 ? "week" : "weeks"}`;
}
