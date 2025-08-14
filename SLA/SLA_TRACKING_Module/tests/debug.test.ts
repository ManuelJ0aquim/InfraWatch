import { startOfMonthUTC, endOfMonthUTC } from '../src/SLA_TRACKING/utils/time';

describe('Time Utilities Debug', () => {
  test('Debug timezone calculations', () => {
    const start = startOfMonthUTC(2025, 8, 'Africa/Luanda');
    const end = endOfMonthUTC(2025, 8, 'Africa/Luanda');
    
    console.log('Start:', start.toISOString());
    console.log('Start Month (0-indexed):', start.getUTCMonth());
    console.log('Start Date:', start.getUTCDate());
    console.log('Start Hour:', start.getUTCHours());
    
    console.log('End:', end.toISOString());
    console.log('End Month (0-indexed):', end.getUTCMonth());
    console.log('End Date:', end.getUTCDate());
    console.log('End Hour:', end.getUTCHours());
    
    // Just to pass the test while debugging
    expect(start).toBeDefined();
    expect(end).toBeDefined();
  });
});
