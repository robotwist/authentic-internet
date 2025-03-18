import testShakespeareResponses from './shakespeare-test';
import { NPC_TYPES } from '../components/Constants';
import { chat } from '../api/api';

// Test all historical NPCs
async function testHistoricalNPCs() {
  console.log('🧪 Running tests for historical NPCs...');
  console.log('======================================');
  
  // Test Shakespeare
  await testShakespeareResponses();
  
  // Test other historical NPCs
  const historicalNPCs = [
    {
      type: NPC_TYPES.ADA_LOVELACE,
      name: 'Ada Lovelace',
      role: 'Mathematician and Computer Pioneer',
      context: 'You are Ada Lovelace, the first computer programmer and a visionary mathematician.'
    },
    {
      type: NPC_TYPES.LORD_BYRON,
      name: 'Lord Byron',
      role: 'Romantic Poet',
      context: 'You are Lord Byron, a leading figure in the Romantic movement and one of the most influential British poets.'
    }
  ];
  
  for (const npc of historicalNPCs) {
    console.log(`\n🧪 Testing ${npc.name} NPC responses...`);
    console.log('======================================');
    
    try {
      const result = await chat("Tell me about yourself", npc.context, npc.role, npc);
      console.log(`✅ ${npc.name} responded successfully`);
      
      if (result.response) {
        if (typeof result.response === 'string') {
          console.log(`📜 Response: "${result.response.substring(0, 100)}..."`);
        } else if (Array.isArray(result.response)) {
          console.log(`📜 First response: "${result.response[0].text.substring(0, 100)}..."`);
        }
      }
      
      if (result.source) {
        console.log(`📚 Source: ${result.source}`);
      }
    } catch (error) {
      console.error(`❌ Error testing ${npc.name}:`, error.message);
    }
  }
}

// Test application functionality
async function testAppFunctionality() {
  console.log('\n🧪 Testing application functionality...');
  console.log('======================================');
  
  // Test font loading
  try {
    console.log('🔤 Testing font loading...');
    const fontFamilies = document.fonts.check('12px "Chicago"');
    console.log(fontFamilies ? '✅ Chicago font loaded successfully' : '❌ Chicago font not loaded');
  } catch (error) {
    console.error('❌ Error testing fonts:', error.message);
  }
  
  // Test character movement
  try {
    console.log('🏃 Testing character movement...');
    const character = document.querySelector('.character');
    console.log(character ? '✅ Character element found' : '❌ Character element not found');
  } catch (error) {
    console.error('❌ Error testing character:', error.message);
  }
  
  // Test NPC rendering
  try {
    console.log('👤 Testing NPC rendering...');
    const npcs = document.querySelectorAll('.npc');
    console.log(`✅ Found ${npcs.length} NPCs on the current map`);
  } catch (error) {
    console.error('❌ Error testing NPCs:', error.message);
  }
  
  // Test artifact rendering
  try {
    console.log('🏺 Testing artifact rendering...');
    const artifacts = document.querySelectorAll('.artifact');
    console.log(`✅ Found ${artifacts.length} artifacts on the current map`);
  } catch (error) {
    console.error('❌ Error testing artifacts:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Starting comprehensive test suite...');
  console.log('======================================');
  
  try {
    // Test historical NPCs
    await testHistoricalNPCs();
    
    // Test app functionality if in browser environment
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      await testAppFunctionality();
    } else {
      console.log('\n⚠️ Skipping browser tests (not in browser environment)');
    }
    
    console.log('\n🎉 All tests completed!');
  } catch (error) {
    console.error('❌ Error running tests:', error);
  }
}

// Export the test functions
export { 
  testShakespeareResponses,
  testHistoricalNPCs,
  testAppFunctionality,
  runAllTests
};

// Auto-run tests if this script is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runAllTests();
} 