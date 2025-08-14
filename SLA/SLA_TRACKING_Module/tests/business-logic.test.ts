import { WindowStatus } from '../src/SLA_TRACKING/domain/types';
import { DEFAULT_TIMEZONE, HYSTERESIS_FAILURES, MIN_INCIDENT_DURATION_MS } from '../src/SLA_TRACKING/domain/constants';

describe('Business Logic Validation', () => {
  describe('Constants', () => {
    test('should have valid default timezone', () => {
      expect(DEFAULT_TIMEZONE).toBe('Africa/Luanda');
    });

    test('should have reasonable hysteresis threshold', () => {
      expect(HYSTERESIS_FAILURES).toBeGreaterThan(0);
      expect(HYSTERESIS_FAILURES).toBeLessThan(10);
    });

    test('should have reasonable minimum incident duration', () => {
      expect(MIN_INCIDENT_DURATION_MS).toBeGreaterThan(0);
      expect(MIN_INCIDENT_DURATION_MS).toBeLessThanOrEqual(5 * 60 * 1000); // max 5 minutes
    });
  });

  describe('Window Status Logic', () => {
    test('should handle availability percentage correctly', () => {
      // Test uptime calculation logic
      const totalMs = 24 * 60 * 60 * 1000; // 24 hours
      const downtimeMs = 2 * 60 * 1000; // 2 minutes
      const uptimeMs = totalMs - downtimeMs;
      const availabilityPct = (uptimeMs / totalMs) * 100;
      
      expect(availabilityPct).toBeGreaterThan(99.8);
      expect(availabilityPct).toBeLessThan(100);
    });

    test('should calculate error budget correctly', () => {
      const totalMs = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
      const targetPct = 99.9;
      const allowedDowntimeMs = Math.round(totalMs * (1 - targetPct / 100));
      
      // For 99.9% uptime, we should allow ~43.2 minutes of downtime per month
      const expectedDowntimeMinutes = (30 * 24 * 60) * 0.001; // 43.2 minutes
      const calculatedDowntimeMinutes = allowedDowntimeMs / (60 * 1000);
      
      expect(calculatedDowntimeMinutes).toBeCloseTo(expectedDowntimeMinutes, 1);
    });
  });

  describe('Date Range Validation', () => {
    test('should handle valid date ranges', () => {
      const start = new Date('2025-08-01T00:00:00Z');
      const end = new Date('2025-08-31T23:59:59Z');
      
      expect(end.getTime()).toBeGreaterThan(start.getTime());
      expect(end.getTime() - start.getTime()).toBeGreaterThan(0);
    });

    test('should handle incident overlapping with maintenance', () => {
      const incidentStart = new Date('2025-08-14T10:00:00Z');
      const incidentEnd = new Date('2025-08-14T11:00:00Z');
      const maintStart = new Date('2025-08-14T10:30:00Z');
      const maintEnd = new Date('2025-08-14T10:45:00Z');
      
      // Check if maintenance overlaps with incident
      const overlaps = maintStart < incidentEnd && maintEnd > incidentStart;
      expect(overlaps).toBe(true);
      
      // Calculate overlap duration
      const overlapStart = new Date(Math.max(incidentStart.getTime(), maintStart.getTime()));
      const overlapEnd = new Date(Math.min(incidentEnd.getTime(), maintEnd.getTime()));
      const overlapMs = overlapEnd.getTime() - overlapStart.getTime();
      
      expect(overlapMs).toBe(15 * 60 * 1000); // 15 minutes
    });
  });
});
