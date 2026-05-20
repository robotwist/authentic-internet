import {
  login,
  checkAuthStatus,
  clearStorageData,
  API,
} from "../../../../client/src/api/api.js";
import { testLogin } from "./testLogin";
import { testArtifactUpdate } from "./artifactTests";
import { testShakespeare } from "./shakespeareTest";

export const testAppFunctionality = async () => {
  console.log("🧪 Testing application functionality...");
  console.log("======================================");

  // Clear existing tokens to start fresh
  console.log("🧹 Clearing existing authentication data...");
  clearStorageData();

  // First, check and report authentication status
  console.log("🔐 Checking authentication status...");
  const authStatus = checkAuthStatus();

  // If not authenticated, try to login with test user
  if (!authStatus.isAuthenticated) {
    console.log("⚠️ Not authenticated, attempting to login with test user...");
    try {
      const loginSuccess = await login("testuser", "password123", true);
      if (loginSuccess) {
        console.log("✅ Test login successful");

        // Verify token is in storage
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");
        if (token) {
          console.log("🔄 Ensuring token is set in API headers");
          API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        } else {
          console.error("❌ No token found after login");
        }
      } else {
        console.error(
          "❌ Test login failed - tests requiring authentication may fail",
        );
      }
    } catch (error) {
      console.error("❌ Authentication error:", error);
    }
  } else {
    console.log("✅ Already authenticated");
  }

  // Run all tests
  const tests = [
    { name: "Login Test", fn: testLogin },
    { name: "Artifact Update Test", fn: testArtifactUpdate },
    { name: "Shakespeare Test", fn: testShakespeare },
    // Add more tests here as needed
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const test of tests) {
    console.log(`\n🧪 Running test: ${test.name}`);
    try {
      const result = await test.fn();
      if (result) {
        console.log(`✅ ${test.name} PASSED`);
        passedTests++;
      } else {
        console.error(`❌ ${test.name} FAILED`);
        failedTests++;
      }
    } catch (error) {
      console.error(`❌ ${test.name} ERROR: ${error.message}`);
      failedTests++;
    }
  }

  console.log("\n🔍 Test Summary:");
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📊 Total:  ${tests.length}`);

  return {
    passed: passedTests,
    failed: failedTests,
    total: tests.length,
  };
};

// Auto-run when loaded directly
if (import.meta.url.endsWith("run-tests.js")) {
  testAppFunctionality().then((results) => {
    console.log("\n🎉 All tests completed!");
  });
}

export default testAppFunctionality;
