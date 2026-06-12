export const updateUserExperienceWithClient = async (apiClient, experience) => {
  const response = await apiClient.put("/api/users/experience", {
    experience,
  });
  return response.data;
};

export const awardUserExperienceWithClient = async (
  apiClient,
  amount,
  reason = "Gameplay",
  artifactId,
) => {
  const payload = { amount, reason };
  if (artifactId) {
    payload.artifactId = artifactId;
  }

  const response = await apiClient.post("/api/progress/experience", payload);
  return response.data;
};
