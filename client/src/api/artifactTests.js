// Artifact Testing Utilities
import API, { updateArtifact, connectionStatus } from "./api.js";

// Configuration for test artifacts
const TEST_ARTIFACT_ID = "test-artifact-12345";
const TEST_UPDATE_DATA = {
  name: "Updated Test Artifact",
  description: "This is an updated test description",
  content: "Updated test content",
};

// Export the test artifact info for reference
export const testConfig = {
  artifactId: TEST_ARTIFACT_ID,
  updateData: TEST_UPDATE_DATA,
};

/**
 * Run a comprehensive test of artifact update functionality
 */
export const testArtifactUpdate = async () => {
  console.log("🧪 Running Artifact Update Tests");
  console.log("===================================");

  try {
    // First check server connection before attempting tests
    const isServerAvailable = await testServerConnection();
    if (!isServerAvailable) {
      console.error(
        "❌ Cannot proceed with artifact tests - Server not available",
      );
      return false;
    }

    // First test basic JSON update
    await testBasicUpdate();

    // Test direct fetch approach (bypassing axios)
    await testDirectFetchUpdate();

    // Test with form data (if needed)
    // await testFormDataUpdate();

    console.log("\n✅ All artifact update tests completed successfully!");
    return true;
  } catch (error) {
    console.error(`❌ Artifact update test failed: ${error.message}`);
    return false;
  }
};

/**
 * Test basic JSON update functionality
 */
const testBasicUpdate = async () => {
  console.log("\n📋 STEP 1: Testing basic artifact update with JSON data");

  try {
    console.log(`Making update request to artifact ID: ${TEST_ARTIFACT_ID}`);
    console.log("Update data:", TEST_UPDATE_DATA);

    // Make the update request with test mode enabled - using updated function signature
    const result = await updateArtifact(TEST_ARTIFACT_ID, TEST_UPDATE_DATA, {
      testMode: true,
    });

    console.log("✅ Basic update test succeeded!");
    console.log("Response:", result);

    return result;
  } catch (error) {
    console.error("❌ Basic update test failed:", error);
    throw error;
  }
};

/**
 * Test direct fetch update (bypassing axios)
 */
const testDirectFetchUpdate = async () => {
  console.log("\n📋 STEP 2: Testing direct fetch update (bypassing axios)");

  try {
    // Get the token
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
      console.warn("⚠️ No authentication token found. This test may fail.");
    }

    // Get the API URL from connection status or fall back to environment variables
    const baseUrl =
      connectionStatus.activeUrl ||
      import.meta.env.VITE_API_URL ||
      "http://localhost:5000";

    console.log(
      `Making direct fetch request to: ${baseUrl}/api/artifacts/${TEST_ARTIFACT_ID}?testMode=true`,
    );

    // Create headers
    const headers = {
      "Content-Type": "application/json",
      "X-Test-Mode": "true",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Make the direct fetch request
    const response = await fetch(
      `${baseUrl}/api/artifacts/${TEST_ARTIFACT_ID}?testMode=true`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({
          ...TEST_UPDATE_DATA,
          _directFetchTest: true,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Direct fetch failed with status: ${response.status}`);
    }

    const result = await response.json();

    console.log("✅ Direct fetch update test succeeded!");
    console.log("Response:", result);

    return result;
  } catch (error) {
    console.error("❌ Direct fetch update test failed:", error);
    throw error;
  }
};

/**
 * Test direct API connection without authToken
 */
export const testServerConnection = async () => {
  try {
    console.log("🔌 Testing direct connection to API server...");

    // Get the potential server URLs to test
    const primaryUrl =
      typeof import.meta !== "undefined"
        ? import.meta.env?.VITE_API_URL || "http://localhost:5000"
        : "http://localhost:5000";
    const fallbackUrl =
      typeof import.meta !== "undefined"
        ? import.meta.env?.VITE_API_FALLBACK_URL || "http://localhost:5001"
        : "http://localhost:5001";

    // Test multiple endpoint possibilities with both primary and fallback URLs
    const urlsToTry = [
      `${primaryUrl}/health`,
      `${primaryUrl}/api/health`,
      `${fallbackUrl}/health`,
      `${fallbackUrl}/api/health`,
    ];

    let serverFound = false;
    let responseData = null;

    console.log(`Trying to connect to server at multiple endpoints...`);

    for (const url of urlsToTry) {
      try {
        console.log(`Trying endpoint: ${url}`);
        const response = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-cache",
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Server connection successful at ${url}`);
          console.log("Server response:", data);

          // Update connection status in the application
          const serverUrl = new URL(url);
          const baseUrl = `${serverUrl.protocol}//${serverUrl.host}`;
          connectionStatus.activeUrl = baseUrl;
          connectionStatus.isConnected = true;
          connectionStatus.lastChecked = new Date();

          // Update Axios baseURL if using the API export
          if (API && API.defaults) {
            API.defaults.baseURL = baseUrl;
            console.log(`Updated API base URL to ${baseUrl}`);
          }

          responseData = data;
          serverFound = true;
          break;
        }
      } catch (e) {
        console.warn(`Failed to connect to ${url}: ${e.message}`);
      }
    }

    if (!serverFound) {
      console.error("❌ Could not connect to the server at any endpoint");
      console.error("Please ensure the server is running using:");
      console.error("cd server && PORT=5000 npm start");

      // Update connection status
      connectionStatus.isConnected = false;
      connectionStatus.error = "Failed to connect to the server";
      connectionStatus.lastChecked = new Date();

      throw new Error(
        "All connection attempts failed - server may not be running",
      );
    }

    return true;
  } catch (error) {
    console.error("❌ Server connection test failed:", error);
    return false;
  }
};

// Export the test functions
export default {
  testArtifactUpdate,
  testServerConnection,
  testConfig,
};
