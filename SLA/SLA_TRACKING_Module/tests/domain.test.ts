import { WindowStatus } from '../src/SLA_TRACKING/domain/types';

describe('Domain Types and Constants', () => {
  test('WindowStatus enum should have correct values', () => {
    expect(WindowStatus.OK).toBe('OK');
    expect(WindowStatus.AT_RISK).toBe('AT_RISK');
    expect(WindowStatus.BREACHED).toBe('BREACHED');
  });

  test('WindowStatus should have all required values', () => {
    const values = Object.values(WindowStatus);
    expect(values).toContain('OK');
    expect(values).toContain('AT_RISK');
    expect(values).toContain('BREACHED');
    expect(values).toHaveLength(3);
  });
});
