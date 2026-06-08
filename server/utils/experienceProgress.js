export const normalizeExperienceInput = (experience) => {
  if (!Number.isFinite(experience) || experience < 0) {
    return null;
  }

  return Math.floor(experience);
};

export const buildExperienceUpdatePipeline = (experience) => {
  const currentExperience = { $ifNull: ["$experience", 0] };
  const mergedExperience = { $max: [currentExperience, experience] };
  const calculatedLevel = {
    $add: [{ $floor: { $divide: [mergedExperience, 100] } }, 1],
  };

  return [{
    $set: {
      experience: mergedExperience,
      level: { $max: [{ $ifNull: ["$level", 1] }, calculatedLevel] },
    },
  }];
};
