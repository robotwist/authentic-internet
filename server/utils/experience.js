export const normalizeExperience = (experience) => {
  if (typeof experience !== 'number' || !Number.isFinite(experience)) {
    return null;
  }

  return Math.max(0, Math.floor(experience));
};

export const calculateLevelFromExperience = (experience) => {
  const normalizedExperience = normalizeExperience(experience);
  if (normalizedExperience === null) {
    return null;
  }

  return Math.floor(normalizedExperience / 100) + 1;
};
