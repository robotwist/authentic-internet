// Test Login Script
// Run this in the browser console to check if login is working properly

import {
  login,
  checkAuthStatus,
  clearStorageData,
  getCurrentUser,
} from "../../../../client/src/api/api.js";

export const testLogin = async () => {
  console.log("📝 Login Test Utility");
  console.log("====================");

  // Step 1: Clear any existing auth data
  console.log("🧹 Step 1: Clearing any existing auth data...");
  clearStorageData();

  // Step 2: Check initial status (should be unauthenticated)
  console.log(
    "\n🔍 Step 2: Checking initial auth status (should be unauthenticated)...",
  );
  const initialStatus = checkAuthStatus();

  if (initialStatus.isAuthenticated) {
    console.error("❌ Error: Still authenticated after clearing storage!");
    return false;
  } else {
    console.log("✅ Correctly showing as unauthenticated");
  }

  // Step 3: Attempt login
  console.log("\n🔑 Step 3: Attempting login with test credentials...");
  try {
    const loginSuccess = await login("testuser", "password123", true);

    if (loginSuccess) {
      console.log("✅ Login API call successful");
    } else {
      console.error("❌ Login API call failed");
      return false;
    }
  } catch (error) {
    console.error("❌ Login threw an exception:", error);
    return false;
  }

  // Step 4: Verify authentication after login
  console.log("\n✅ Step 4: Verifying authentication status after login...");
  const afterLoginStatus = checkAuthStatus();

  if (afterLoginStatus.isAuthenticated) {
    console.log("✅ Successfully authenticated!");
  } else {
    console.error("❌ Error: Still not authenticated after successful login!");
    console.log(
      "Please check browser console for errors and network requests.",
    );
    return false;
  }

  // Step 5: Test token transmission in a request
  console.log("\n📤 Step 5: Testing token transmission in API request...");
  try {
    // Try to get the current user with our token
    const user = await getCurrentUser();

    if (user && user.username) {
      console.log("✅ Successfully received user data:", user.username);
    } else {
      console.error("❌ Failed to retrieve user data with token");
      return false;
    }
  } catch (error) {
    console.error("❌ API request with token failed:", error);
    return false;
  }

  console.log("\n🎉 Login test completed successfully!");
  return true;
};

// Auto-run the test when this file is loaded
// You can disable this by commenting out the line below
testLogin().then((success) => {
  console.log(`Login test ${success ? "PASSED ✅" : "FAILED ❌"}`);
});

export default testLogin;
