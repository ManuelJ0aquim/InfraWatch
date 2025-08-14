import { unplannedDowntimeMs } from '../src/SLA_TRACKING/utils/ranges';
import { startOfMonthUTC, endOfMonthUTC, msBetween, clampToWindow } from '../src/SLA_TRACKING/utils/time';

describe('Time Utilities', () => {
  test('startOfMonthUTC should return correct start of month', () => {
    const start = startOfMonthUTC(2025, 8, 'Africa/Luanda');
    // For month 8 (August), with -1 hour offset, we get July 31st 23:00 UTC
    expect(start.getUTCFullYear()).toBe(2025);
    expect(start.getUTCMonth()).toBe(6); // July (0-indexed) 
    expect(start.getUTCDate()).toBe(31);
    expect(start.getUTCHours()).toBe(23); // offset -1 hour for Africa/Luanda
  });

  test('endOfMonthUTC should return correct end of month', () => {
    const end = endOfMonthUTC(2025, 8, 'Africa/Luanda');
    // For month 8 (August), with -1 hour offset, we get August 31st 23:00 UTC  
    expect(end.getUTCFullYear()).toBe(2025);
    expect(end.getUTCMonth()).toBe(7); // August (0-indexed)
    expect(end.getUTCDate()).toBe(31);
    expect(end.getUTCHours()).toBe(23); // offset -1 hour for Africa/Luanda
  });

  test('msBetween should calculate correct milliseconds', () => {
    const a = new Date('2025-01-01T00:00:00Z');
    const b = new Date('2025-01-01T01:00:00Z');
    expect(msBetween(a, b)).toBe(3600000); // 1 hour in ms
  });

  test('clampToWindow should return null for non-overlapping periods', () => {
    const start = new Date('2025-01-01T00:00:00Z');
    const end = new Date('2025-01-01T12:00:00Z');
    const a = new Date('2025-01-01T13:00:00Z');
    const b = new Date('2025-01-01T14:00:00Z');
    expect(clampToWindow(start, end, a, b)).toBeNull();
  });

  test('clampToWindow should return clamped range for overlapping periods', () => {
    const start = new Date('2025-01-01T00:00:00Z');
    const end = new Date('2025-01-01T12:00:00Z');
    const a = new Date('2024-12-31T23:00:00Z');
    const b = new Date('2025-01-01T13:00:00Z');
    const result = clampToWindow(start, end, a, b);
    expect(result).not.toBeNull();
    expect(result![0]).toEqual(start);
    expect(result![1]).toEqual(end);
  });
});

describe('Range Utilities', () => {
  test('unplannedDowntimeMs should calculate correct unplanned downtime', () => {
    const incStart = new Date('2025-01-01T10:00:00Z');
    const incEnd = new Date('2025-01-01T11:00:00Z');
    const maints = [
      {
        startsAt: '2025-01-01T10:15:00Z',
        endsAt: '2025-01-01T10:45:00Z'
      }
    ];
    
    const result = unplannedDowntimeMs(incStart, incEnd, maints);
    // 1 hour total - 30 minutes maintenance = 30 minutes unplanned
    expect(result).toBe(1800000); // 30 minutes in ms
  });

  test('unplannedDowntimeMs should handle no maintenance windows', () => {
    const incStart = new Date('2025-01-01T10:00:00Z');
    const incEnd = new Date('2025-01-01T11:00:00Z');
    const maints: any[] = [];
    
    const result = unplannedDowntimeMs(incStart, incEnd, maints);
    expect(result).toBe(3600000); // 1 hour in ms
  });

  test('unplannedDowntimeMs should handle overlapping maintenance windows', () => {
    const incStart = new Date('2025-01-01T10:00:00Z');
    const incEnd = new Date('2025-01-01T11:00:00Z');
    const maints = [
      {
        startsAt: '2025-01-01T10:15:00Z',
        endsAt: '2025-01-01T10:45:00Z'
      },
      {
        startsAt: '2025-01-01T10:30:00Z',
        endsAt: '2025-01-01T10:50:00Z'
      }
    ];
    
    const result = unplannedDowntimeMs(incStart, incEnd, maints);
    // Should merge overlapping windows: 10:15-10:50 = 35 minutes maintenance
    // 1 hour - 35 minutes = 25 minutes unplanned
    expect(result).toBe(1500000); // 25 minutes in ms
  });
});
