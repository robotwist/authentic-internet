// Simple script to test artifact API
import axios from "axios";

// Basic axios instance for tests
const api = axios.create({
  baseURL: "http://localhost:5000",
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
    "X-Test-Mode": "true",
    "X-Test-Auth": "true", // Add test auth header to all requests
  },
});

// Test data
const TEST_ARTIFACT_ID = "test-artifact-12345";
const TEST_UPDATE_DATA = {
  name: "Updated Test Artifact",
  description: "This is an updated test description",
  content: "Updated test content",
};

// Test server connection
async function testServerConnection() {
  console.log("\nTesting Server Connection...");
  try {
    const response = await api.get("/health");
    console.log("SUCCESS: Server is online");
    console.log("Response:", response.data);
    return true;
  } catch (error) {
    console.error("ERROR:", error.message);
    return false;
  }
}

// Test basic update with testMode
async function testBasicUpdate() {
  console.log("\nTesting Basic Artifact Update...");
  try {
    const url = `/api/artifacts/${TEST_ARTIFACT_ID}?testMode=true`;
    const response = await api.put(url, TEST_UPDATE_DATA);
    console.log("SUCCESS: Artifact update simulation successful");
    console.log("Response:", response.data);
    return true;
  } catch (error) {
    console.error("ERROR:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    return false;
  }
}

// Test direct fetch
async function testDirectFetch() {
  console.log("\nTesting Direct Fetch Update...");
  try {
    const url = `http://localhost:5000/api/artifacts/${TEST_ARTIFACT_ID}?testMode=true`;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Test-Mode": "true",
        "X-Test-Auth": "true", // Add test auth header
      },
      body: JSON.stringify({
        ...TEST_UPDATE_DATA,
        _directFetchTest: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Direct fetch failed with status: ${response.status}`);
    }

    const data = await response.json();
    console.log("SUCCESS: Direct fetch update successful");
    console.log("Response:", data);
    return true;
  } catch (error) {
    console.error("ERROR:", error.message);
    return false;
  }
}

// Test artifact creation simulation
async function testArtifactCreate() {
  console.log("\nTesting Artifact Creation...");
  try {
    const url = "/api/artifacts?testMode=true";
    const newArtifact = {
      name: "Test Artifact",
      description: "This is a test artifact description",
      content: "Test artifact content",
      area: "testArea",
      location: { x: 100, y: 100 },
    };

    // For test mode, we need to include a special header that mimics authentication
    const headers = {
      "Content-Type": "application/json",
      "X-Test-Mode": "true",
      "X-Test-Auth": "true", // This signals the server to skip real authentication for tests
    };

    // Create a special instance just for this request with the auth header
    const authApi = axios.create({
      baseURL: "http://localhost:5000",
      timeout: 5000,
      headers: headers,
    });

    const response = await authApi.post(url, newArtifact);
    console.log("SUCCESS: Artifact creation simulation successful");
    console.log("Response:", response.data);
    return true;
  } catch (error) {
    console.error("ERROR:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log("====== STARTING ARTIFACT API TESTS ======");

  // First check server connection
  const serverConnected = await testServerConnection();
  if (!serverConnected) {
    console.error("\n❌ Cannot proceed with tests - Server not available");
    return;
  }

  // Run the artifact tests
  const basicUpdateResult = await testBasicUpdate();
  const directFetchResult = await testDirectFetch();
  const createResult = await testArtifactCreate();

  // Report results
  console.log("\n====== TEST RESULTS ======");
  console.log("Server Connection:", serverConnected ? "✅ PASS" : "❌ FAIL");
  console.log(
    "Basic Artifact Update:",
    basicUpdateResult ? "✅ PASS" : "❌ FAIL",
  );
  console.log(
    "Direct Fetch Update:",
    directFetchResult ? "✅ PASS" : "❌ FAIL",
  );
  console.log("Artifact Creation:", createResult ? "✅ PASS" : "❌ FAIL");
}

// Run all tests
runAllTests();
