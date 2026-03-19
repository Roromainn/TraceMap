import { colors } from './colors';

describe('colors', () => {
  it('has all primary orange theme colors', () => {
    expect(colors.primary).toBe('#F97316');
    expect(colors.primaryLight).toBe('#FB923C');
    expect(colors.primaryDark).toBe('#EA580C');
  });

  it('has all heart rate zone colors', () => {
    expect(colors.hrZone1).toBe('#9CA3AF');
    expect(colors.hrZone2).toBe('#60A5FA');
    expect(colors.hrZone3).toBe('#10B981');
    expect(colors.hrZone4).toBe('#F59E0B');
    expect(colors.hrZone5).toBe('#EF4444');
  });

  it('has altitude gradient colors', () => {
    expect(colors.altitudeLow).toBe('#3B82F6');
    expect(colors.altitudeMid).toBe('#F97316');
    expect(colors.altitudeHigh).toBe('#EF4444');
  });
});
