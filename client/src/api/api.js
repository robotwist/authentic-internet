import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// 🔹 Attach Token to Requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ────────────────────────────────
   🔹 AUTHENTICATION ENDPOINTS
──────────────────────────────── */
export const loginUser = async (username, password) => {
  try {
    const response = await API.post("/auth/login", { username, password });
    localStorage.setItem("token", response.data.token);
    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    handleError(error);
  }
};

export const registerUser = async (username, password) => {
  try {
    const response = await API.post("/auth/register", { username, password });
    return response.data;
  } catch (error) {
    console.error("Registration error:", error);
    handleError(error);
  }
};

/* ────────────────────────────────
   🔹 CHARACTER ENDPOINTS
──────────────────────────────── */
export const fetchCharacter = async (userId) => {
  try {
    const response = await API.get(`/users/${userId}`);
    console.log("Character data response:", response); // Debugging log
    return response.data;
  } catch (error) {
    console.error("Error fetching character:", error);
    handleError(error);
  }
};

export const updateCharacter = async (updatedCharacter) => {
  try {
    const response = await API.put(`/characters/${updatedCharacter._id}`, updatedCharacter);
    return response.data;
  } catch (error) {
    console.error("❌ Error updating character:", error);
    handleError(error);
  }
};

/* ────────────────────────────────
   🔹 ARTIFACT ENDPOINTS (CRUD)
──────────────────────────────── */
export const fetchArtifacts = async () => {
  try {
    const response = await API.get("/artifacts");
    console.log("Fetched artifacts:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching artifacts:", error);
    throw error;
  }
};

export const createArtifact = async (artifactData) => {
  try {
    const response = await API.post("/artifacts", artifactData);
    return response.data;
  } catch (error) {
    console.error("Error creating artifact:", error);
    handleError(error);
  }
};

export const updateArtifact = async (artifactId, updatedData) => {
  try {
    const response = await API.put(`/artifacts/${artifactId}`, updatedData);
    console.log("Updated artifact:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating artifact:", error);
    throw error;
  }
};

export const deleteArtifact = async (artifactId) => {
  try {
    const response = await API.delete(`/artifacts/${artifactId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting artifact:", error);
    handleError(error);
  }
};

/* ────────────────────────────────
   🔹 MESSAGING ENDPOINTS (CRUD)
──────────────────────────────── */
export const sendMessage = async (recipient, content, artifactId = null) => {
  try {
    console.log("🚀 Sending message payload:", { recipient, content, artifactId });
    const response = await API.post("/messages", { recipient, content, artifactId });
    return response.data;
  } catch (error) {
    console.error("❌ Error sending message:", error.response?.data || error.message);
    handleError(error);
    return null;
  }
};

export const fetchMessage = async (artifactId) => {
  try {
    const response = await API.get(`/artifacts/${artifactId}/message`);
    console.log("Fetched message:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching message:", error);
    return null;
  }
};

export const fetchMessages = async () => {
  try {
    const response = await API.get("/messages");
    return response.data;
  } catch (error) {
    console.error("Error fetching messages:", error);
    handleError(error);
    return [];
  }
};

export const updateMessage = async (artifactId, messageText) => {
  try {
    const response = await API.put(`/artifacts/${artifactId}/message`, { messageText });
    console.log("Updated message:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating message:", error);
    throw error;
  }
};

export const deleteMessage = async (artifactId) => {
  try {
    const response = await API.delete(`/artifacts/${artifactId}/message`);
    console.log("Deleted message:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
};

/* ────────────────────────────────
   🔹 ERROR HANDLING FUNCTION
──────────────────────────────── */
const handleError = (error) => {
  if (error.response) {
    console.error("Backend error:", error.response.data);
    throw error.response.data;
  } else if (error.request) {
    console.error("Network error:", error.request);
    throw new Error("Network error, please try again later.");
  } else {
    console.error("Error:", error.message);
    throw new Error(error.message);
  }
};

export default API;
