import { DEFAULT_TIMEZONE } from "../domain/constants";

function tzOffsetHours(tz: string): number {
  if (tz === "Africa/Luanda")
    return 1;
  return 0;
}

export function startOfMonthUTC(year: number, month1to12: number, tz: string = DEFAULT_TIMEZONE): Date {
  const offset = tzOffsetHours(tz);
  return new Date(Date.UTC(year, month1to12 - 1, 1, 0 - offset, 0, 0, 0));
}

export function endOfMonthUTC(year: number, month1to12: number, tz: string = DEFAULT_TIMEZONE): Date {
  const offset = tzOffsetHours(tz);
  return new Date(Date.UTC(year, month1to12, 1, 0 - offset, 0, 0, 0));
}

export function nowUtcISO(): string {
  return new Date().toISOString();
}

export function msBetween(a: Date, b: Date): number {
  return b.getTime() - a.getTime();
}

export function clampToWindow(start: Date, end: Date, a: Date, b: Date): [Date, Date] | null {
  const s = a > start ? a : start;
  const e = (b < end ? b : end);
  if (e <= s) return null;
  return [s, e];
}
