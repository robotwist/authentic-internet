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
// 📌 Login User
export const loginUser = async (username, password) => {
  try {
    const response = await API.post("/auth/login", { username, password });
    localStorage.setItem("token", response.data.token);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 📌 Register User
export const registerUser = async (username, password) => {
  try {
    const response = await API.post("/auth/register", { username, password });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

/* ────────────────────────────────
   🔹 ARTIFACT ENDPOINTS (CRUD)
──────────────────────────────── */
// 📌 Fetch All Artifacts
export const fetchArtifacts = async () => {
  try {
    const response = await API.get("/artifacts");
    return response.data;
  } catch (error) {
    console.error("Error fetching artifacts:", error);
    return [];
  }
};

// 📌 Create an Artifact
export const createArtifact = async (artifactData) => {
  try {
    const response = await API.post("/artifacts", artifactData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 📌 Update an Artifact
export const updateArtifact = async (artifactId, updatedData) => {
  try {
    const response = await API.put(`/artifacts/${artifactId}`, updatedData);
    return response.data;
  } catch (error) {
    console.error("Error updating artifact:", error);
    throw error;
  }
};

// 📌 Delete an Artifact
export const deleteArtifact = async (artifactId) => {
  try {
    const response = await API.delete(`/artifacts/${artifactId}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 📌 Unlock an Artifact (Solve Riddle)
export const unlockArtifact = async (artifactId, answer) => {
  try {
    const response = await API.post(`/artifacts/unlock/${artifactId}`, { answer });
    return response.data;
  } catch (error) {
    console.error("Error unlocking artifact:", error);
    return null;
  }
};

/* ────────────────────────────────
   🔹 ARTIFACT MESSAGING
──────────────────────────────── */
// 📌 Fetch Message from Artifact
export const fetchMessage = async (artifactId) => {
  try {
    const response = await API.get(`/artifacts/${artifactId}/message`);
    return response.data;
  } catch (error) {
    console.error("Error fetching message:", error);
    return null;
  }
};

// 📌 Update Message in Artifact
export const updateMessage = async (artifactId, messageText) => {
  try {
    const response = await API.put(`/artifacts/${artifactId}/message`, { messageText });
    return response.data;
  } catch (error) {
    console.error("Error updating message:", error);
    return null;
  }
};


export const deleteArtifactMessage = async (artifactId) => {
  try {
    const response = await API.delete(`/artifacts/${artifactId}/message`);
    return response.data;
  } catch (error) {
    console.error("Error deleting artifact message:", error);
    return null;
  }
};


/* ────────────────────────────────
   🔹 MESSAGING SYSTEM (CRUD)
──────────────────────────────── */
export const sendMessage = async (recipient, content, artifactId = null) => {
  try {
    console.log("Sending message payload:", { recipient, content, artifactId });

    const response = await API.post("/messages", { recipient, content, artifactId });
    console.log("API response from sendMessage:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error sending message:", error.response ? error.response.data : error);
    return null;
  }
};

// 📌 Fetch User Messages
export const fetchMessages = async () => {
  try {
    const response = await API.get("/messages");
    return response.data;
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
};

// 📌 Delete a Message
export const deleteMessage = async (messageId) => {
  try {
    const response = await API.delete(`/messages/${messageId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting message:", error);
    return null;
  }
};

export default API;
