import axios from "axios";

const API_URL = "http://localhost:5000/api/artifacts";

// Fetch all artifacts
export const fetchArtifacts = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching artifacts:", error);
    return [];
  }
};
