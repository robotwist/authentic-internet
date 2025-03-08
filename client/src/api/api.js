import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// 🔹 ATTACH TOKEN TO API REQUESTS
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});
// 🔹 LOGIN FUNCTION
export const loginUser = async (username, password) => {
  try {
    const response = await API.post("/auth/login", { username, password });

    // Store JWT token in localStorage
    localStorage.setItem("token", response.data.token);
    console.log("Token stored:", response.data.token); // Debugging token storage

    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 🔹 REGISTER FUNCTION
export const registerUser = async (username, password) => {
  try {
    const response = await API.post("/auth/register", { username, password });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 🔹 FETCH ARTIFACTS
export const fetchArtifacts = async () => {
  try {
    const response = await API.get("/artifacts");
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 🔹 CREATE ARTIFACT FUNCTION
export const createArtifact = async (artifactData) => {
  try {
    const response = await API.post("/artifacts", artifactData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 🔹 UNLOCK ARTIFACT FUNCTION
export const unlockArtifact = async (artifactId) => {
  try {
    const response = await API.put(`/artifacts/${artifactId}/unlock`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 🔹 DELETE ARTIFACT FUNCTION
export const deleteArtifact = async (artifactId) => {
  try {
    const response = await API.delete(`/artifacts/${artifactId}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 🔹 CHECK USER ACCESS
export const checkUserAccess = async () => {
  try {
    const response = await API.get("/users/me/access");
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 🔹 ADD FRIEND FUNCTION
export const addFriend = async (userId, friendId) => {
  try {
    const response = await API.post(`/users/${userId}/add-friend`, { friendId });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 🔹 ERROR HANDLING FUNCTION
const handleError = (error) => {
  if (error.response) {
    // Server responded with a status other than 200 range
    console.error("Backend error:", error.response.data);
    throw error.response.data;
  } else if (error.request) {
    // Request was made but no response received
    console.error("Network error:", error.request);
    throw new Error("Network error, please try again later.");
  } else {
    // Something else happened
    console.error("Error:", error.message);
    throw new Error(error.message);
  }
};

export default API;
