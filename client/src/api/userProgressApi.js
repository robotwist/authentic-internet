export const persistUserExperience = async ({
  apiClient,
  getToken,
  experience,
}) => {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await apiClient.put("/api/users/experience", {
    experience,
  });
  return response.data;
};
