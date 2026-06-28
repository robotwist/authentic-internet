export const isValidExperienceTotal = (experience) =>
  typeof experience === "number" && Number.isFinite(experience) && experience >= 0;

export const buildMonotonicExperienceUpdate = (experience) => {
  if (!isValidExperienceTotal(experience)) {
    throw new TypeError("Experience must be a finite non-negative number");
  }

  return { $max: { experience } };
};
