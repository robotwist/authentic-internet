export const normalizeExperienceUpdate = (currentExperience, requestedExperience) => {
  if (
    typeof requestedExperience !== 'number' ||
    !Number.isFinite(requestedExperience) ||
    requestedExperience < 0 ||
    !Number.isInteger(requestedExperience)
  ) {
    return {
      valid: false,
      message: 'Experience must be a non-negative integer',
    };
  }

  const current =
    typeof currentExperience === 'number' && Number.isFinite(currentExperience)
      ? Math.max(0, currentExperience)
      : 0;

  return {
    valid: true,
    experience: Math.max(current, requestedExperience),
  };
};
