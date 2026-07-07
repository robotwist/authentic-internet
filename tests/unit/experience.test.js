import {
  calculateLevelFromExperience,
  normalizeExperience,
} from "../../server/utils/experience";

describe("experience utilities", () => {
  test("normalizes persisted experience to a non-negative integer", () => {
    expect(normalizeExperience(150.9)).toBe(150);
    expect(normalizeExperience(-20)).toBe(0);
  });

  test("calculates the persisted user level from total experience", () => {
    expect(calculateLevelFromExperience(0)).toBe(1);
    expect(calculateLevelFromExperience(99)).toBe(1);
    expect(calculateLevelFromExperience(100)).toBe(2);
    expect(calculateLevelFromExperience(250)).toBe(3);
  });

  test("rejects non-numeric experience", () => {
    expect(normalizeExperience("250")).toBeNull();
    expect(calculateLevelFromExperience(Number.NaN)).toBeNull();
  });
});
