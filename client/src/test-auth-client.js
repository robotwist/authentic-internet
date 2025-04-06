/**
 * Simple Authentication Test Client
 * This script tests authentication and game state persistence
 */

import { loginUser, registerUser } from './api/authService.js';
import { getUserGameState, updateGameState } from './api/api.js';

// Test credentials
const testUser = {
  username: `test_user_${Date.now()}`,
  email: `test_${Date.now()}@example.com`,
  password: 'Test1234!',
};

// Test game data
const testGameData = {
  experience: 100,
  lastPosition: {
    worldId: "yosemite",
    x: 5,
    y: 10,
    facing: "up"
  },
  gameState: {
    currentQuest: "find_artifact",
    textAdventureProgress: {
      currentRoom: "forest",
      inventory: ["map", "compass"],
      completedInteractions: ["talk_to_guide", "examine_tree"],
      knownPasswords: ["nature_calls"]
    }
  }
};

// Sleep function
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Main test function
async function runAuthTests() {
  console.log('Starting authentication and game state tests...');
  
  try {
    // Step 1: Register new user
    console.log(`\n=== REGISTERING NEW USER: ${testUser.username} ===`);
    const registerResponse = await registerUser(
      testUser.username,
      testUser.email,
      testUser.password
    );
    console.log('Registration successful:', registerResponse);
    
    // Step 2: Login with new user
    console.log(`\n=== LOGGING IN USER: ${testUser.username} ===`);
    const loginResponse = await loginUser(
      testUser.username,
      testUser.password
    );
    console.log('Login successful:', loginResponse);
    
    // Step 3: Get initial game state
    console.log('\n=== FETCHING INITIAL GAME STATE ===');
    const initialGameState = await getUserGameState();
    console.log('Initial game state:', initialGameState);
    
    // Step 4: Update game state
    console.log('\n=== UPDATING GAME STATE ===');
    console.log('Sending game data:', testGameData);
    const updateResponse = await updateGameState(testGameData);
    console.log('Game state update response:', updateResponse);
    
    // Step 5: Wait briefly to ensure changes are saved
    console.log('\n=== WAITING FOR CHANGES TO PERSIST ===');
    await sleep(1000);
    
    // Step 6: Get updated game state
    console.log('\n=== FETCHING UPDATED GAME STATE ===');
    const updatedGameState = await getUserGameState();
    console.log('Updated game state:', updatedGameState);
    
    // Step 7: Verify changes
    console.log('\n=== VERIFYING CHANGES ===');
    
    // Check experience update
    if (updatedGameState.experience === testGameData.experience) {
      console.log('✅ Experience correctly updated to', updatedGameState.experience);
    } else {
      console.log('❌ Experience not updated correctly');
      console.log(`Expected: ${testGameData.experience}, Got: ${updatedGameState.experience}`);
    }
    
    // Check position update
    if (updatedGameState.lastPosition.worldId === testGameData.lastPosition.worldId) {
      console.log('✅ World position correctly updated to', updatedGameState.lastPosition.worldId);
    } else {
      console.log('❌ World position not updated correctly');
      console.log(`Expected: ${testGameData.lastPosition.worldId}, Got: ${updatedGameState.lastPosition.worldId}`);
    }
    
    // Check quest update
    if (updatedGameState.gameProgress.currentQuest === testGameData.gameState.currentQuest) {
      console.log('✅ Current quest correctly updated to', updatedGameState.gameProgress.currentQuest);
    } else {
      console.log('❌ Current quest not updated correctly');
      console.log(`Expected: ${testGameData.gameState.currentQuest}, Got: ${updatedGameState.gameProgress.currentQuest}`);
    }
    
    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
    
  } catch (error) {
    console.error('Test failed with error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run tests when imported
runAuthTests();

export default runAuthTests; 