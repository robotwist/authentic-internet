import {
  buildMonotonicExperienceUpdate,
  isValidExperienceTotal,
} from "../../server/utils/experience.js";

describe("experience persistence helpers", () => {
  it("builds a monotonic Mongo update so stale totals cannot lower XP", () => {
    expect(buildMonotonicExperienceUpdate(250)).toEqual({
      $max: { experience: 250 },
    });
  });

  it("rejects invalid experience totals before they reach persistence", () => {
    expect(isValidExperienceTotal(0)).toBe(true);
    expect(isValidExperienceTotal(125)).toBe(true);
    expect(isValidExperienceTotal(-1)).toBe(false);
    expect(isValidExperienceTotal(Number.NaN)).toBe(false);
    expect(isValidExperienceTotal("125")).toBe(false);
    expect(() => buildMonotonicExperienceUpdate(-1)).toThrow(
      "Experience must be a finite non-negative number",
    );
  });
});
