const EXPERIENCE_PER_LEVEL = 100;

export const isValidExperienceNumber = (value) => (
  typeof value === 'number' && Number.isFinite(value) && value >= 0
);

export const validateExperienceUpdatePayload = ({ experience, experienceDelta }) => {
  const hasExperience = experience !== undefined;
  const hasExperienceDelta = experienceDelta !== undefined;

  if (!hasExperience && !hasExperienceDelta) {
    return 'Experience must be a number';
  }

  if (hasExperience && !isValidExperienceNumber(experience)) {
    return 'Experience must be a non-negative number';
  }

  if (hasExperienceDelta && !isValidExperienceNumber(experienceDelta)) {
    return 'Experience delta must be a non-negative number';
  }

  return null;
};

export const buildExperienceUpdatePipeline = ({ experience, experienceDelta }) => {
  const hasExperience = experience !== undefined;
  const hasExperienceDelta = experienceDelta !== undefined;
  const currentExperience = { $ifNull: ['$experience', 0] };
  const experienceCandidates = [currentExperience];

  if (hasExperience) {
    experienceCandidates.push(experience);
  }

  if (hasExperienceDelta) {
    experienceCandidates.push({ $add: [currentExperience, experienceDelta] });
  }

  return [
    { $set: { experience: { $max: experienceCandidates } } },
    {
      $set: {
        level: {
          $add: [
            { $floor: { $divide: ['$experience', EXPERIENCE_PER_LEVEL] } },
            1,
          ],
        },
      },
    },
  ];
};

export const updateUserExperience = async (UserModel, userId, payload) => {
  const validationError = validateExperienceUpdatePayload(payload);
  if (validationError) {
    const error = new Error(validationError);
    error.statusCode = 400;
    throw error;
  }

  return UserModel.findByIdAndUpdate(
    userId,
    buildExperienceUpdatePipeline(payload),
    { new: true },
  ).select('username email experience level');
};
