import { normalizeExperienceUpdate } from './experience.js';

describe('normalizeExperienceUpdate', () => {
  it('preserves a higher persisted experience total', () => {
    expect(normalizeExperienceUpdate(1000, 5)).toEqual({
      valid: true,
      experience: 1000,
    });
  });

  it('allows experience totals to increase', () => {
    expect(normalizeExperienceUpdate(1000, 1005)).toEqual({
      valid: true,
      experience: 1005,
    });
  });

  it('rejects invalid experience totals', () => {
    expect(normalizeExperienceUpdate(1000, -1).valid).toBe(false);
    expect(normalizeExperienceUpdate(1000, NaN).valid).toBe(false);
    expect(normalizeExperienceUpdate(1000, 10.5).valid).toBe(false);
    expect(normalizeExperienceUpdate(1000, '1005').valid).toBe(false);
  });
});
