import { updateArtifact, API, login, checkAuthStatus } from "./api/api";

// Function to ensure we're authenticated before running tests
const ensureAuthentication = async () => {
  console.log("🔐 Ensuring authentication before running tests...");

  // Check auth status first
  const authStatus = checkAuthStatus();
  console.log("📋 Current auth status:", authStatus);

  if (authStatus.isAuthenticated) {
    console.log("✅ Already authenticated");

    // Ensure token is set in API headers
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      console.log("🔄 Setting token in API headers");
      API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    return true;
  }

  // If no token, try to login with test user
  try {
    console.log("🔑 Attempting to login with test user...");
    // Try logging in with our test credentials
    const success = await login("testuser", "password123", true);

    if (success) {
      console.log("✅ Test login successful");

      // Verify the token is now in storage and set in headers
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        console.error("❌ Token not found in storage after login");
        return false;
      }

      // Double-check that token is set in API headers
      API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      console.log("🔄 API headers set with token");

      // Sleep for 500ms to ensure everything is properly saved
      await new Promise((resolve) => setTimeout(resolve, 500));

      return true;
    } else {
      console.error("❌ Test login failed");
      return false;
    }
  } catch (error) {
    console.error("❌ Authentication error:", error);
    return false;
  }
};

// Test function for basic artifact update
const testBasicUpdate = async () => {
  try {
    // Test data for artifact update
    const testArtifactId = "test-artifact-12345";
    const updateData = {
      name: "Updated Artifact Name",
      description: "This is an updated description",
      content: "Updated content for testing",
    };

    // Add test mode parameter to avoid permanent changes
    const testMode = true;

    // Attempt to update the artifact
    const result = await updateArtifact(testArtifactId, updateData, {
      testMode,
    });

    console.log("✅ Artifact update successful:", result);
    return true;
  } catch (error) {
    console.error("❌ Basic update test failed:", error);
    return false;
  }
};

// Main test function that exports
export const testArtifactUpdate = async () => {
  console.log("🧪 Testing Artifact Update Functionality");
  console.log("=======================================");

  // Ensure authentication before proceeding
  const isAuthenticated = await ensureAuthentication();
  if (!isAuthenticated) {
    console.error("❌ Authentication failed, cannot proceed with tests");
    return false;
  }

  console.log("\n📋 Testing basic artifact update (JSON)...");

  try {
    // Run the basic update test
    const basicUpdateResult = await testBasicUpdate();

    if (!basicUpdateResult) {
      console.error("❌ Artifact update test failed");
      return false;
    }

    console.log("✅ All artifact update tests passed");
    return true;
  } catch (error) {
    console.error("❌ Artifact update test failed:", error.message);
    return false;
  }
};

// ... rest of the test functions ...
