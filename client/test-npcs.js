import axios from 'axios';

// Basic axios instance for tests
const api = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'X-Test-Mode': 'true',
    'X-Test-Auth': 'true'
  }
});

// Test the NPCs list
async function testNPCsList() {
  console.log('\nTesting NPCs List...');
  try {
    const response = await api.get('/api/npcs/list');
    
    console.log('SUCCESS: Retrieved NPCs list');
    console.log('Number of NPCs:', response.data.length);
    console.log('NPCs:', response.data.map(npc => npc.name).join(', '));
    
    return {
      success: true,
      npcs: response.data
    };
  } catch (error) {
    console.error('ERROR:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status code:', error.response.status);
    }
    return { success: false };
  }
}

// Test John Muir NPC
async function testJohnMuirNPC() {
  console.log('\nTesting John Muir NPC...');
  try {
    const response = await api.post('/api/npcs/john_muir', {
      prompt: "Tell me about nature"
    });
    
    console.log('SUCCESS: John Muir NPC response received');
    console.log('Response:', response.data.response || response.data.text);
    console.log('Source:', response.data.source);
    
    return {
      success: true,
      response: response.data
    };
  } catch (error) {
    console.error('ERROR:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status code:', error.response.status);
    }
    return { success: false };
  }
}

// Test Guide NPC (using general quotes endpoint)
async function testGuideNPC() {
  console.log('\nTesting Guide NPC...');
  
  // Find Guide NPC ID first
  try {
    const npcsResponse = await api.get('/api/npcs/list');
    const guideNPC = npcsResponse.data.find(npc => npc.name === 'Guide');
    
    if (!guideNPC) {
      console.error('ERROR: Guide NPC not found in the NPCs list');
      return { success: false };
    }
    
    console.log('Guide NPC found:', guideNPC.name, `(ID: ${guideNPC._id})`);
    
    // Test interaction with Guide NPC
    try {
      const response = await api.post(`/api/npcs/${guideNPC._id}/interact`, {
        prompt: "I need help navigating this world"
      });
      
      console.log('SUCCESS: Guide NPC interaction succeeded');
      console.log('Response:', response.data);
      
      return {
        success: true,
        response: response.data
      };
    } catch (interactionError) {
      console.error('ERROR during Guide interaction:', interactionError.message);
      if (interactionError.response) {
        console.error('Response data:', interactionError.response.data);
        console.error('Status code:', interactionError.response.status);
      }
      return { success: false };
    }
  } catch (error) {
    console.error('ERROR retrieving NPCs list:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status code:', error.response.status);
    }
    return { success: false };
  }
}

// Test Thalia the Trader NPC
async function testThaliaTraderNPC() {
  console.log('\nTesting Thalia the Trader NPC...');
  
  // Find Thalia NPC ID first
  try {
    const npcsResponse = await api.get('/api/npcs/list');
    const thaliaNPC = npcsResponse.data.find(npc => npc.name === 'Thalia the Trader');
    
    if (!thaliaNPC) {
      console.error('ERROR: Thalia the Trader NPC not found in the NPCs list');
      return { success: false };
    }
    
    console.log('Thalia NPC found:', thaliaNPC.name, `(ID: ${thaliaNPC._id})`);
    
    // Test interaction with Thalia NPC
    try {
      const response = await api.post(`/api/npcs/${thaliaNPC._id}/interact`, {
        prompt: "What items do you have for sale today?"
      });
      
      console.log('SUCCESS: Thalia NPC interaction succeeded');
      console.log('Response:', response.data);
      
      return {
        success: true,
        response: response.data
      };
    } catch (interactionError) {
      console.error('ERROR during Thalia interaction:', interactionError.message);
      if (interactionError.response) {
        console.error('Response data:', interactionError.response.data);
        console.error('Status code:', interactionError.response.status);
      }
      return { success: false };
    }
  } catch (error) {
    console.error('ERROR retrieving NPCs list:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status code:', error.response.status);
    }
    return { success: false };
  }
}

// Run all tests
async function runAllTests() {
  console.log('====== STARTING NPC TESTS ======');
  
  // Run the tests
  const npcListResult = await testNPCsList();
  const johnMuirResult = await testJohnMuirNPC();
  const guideResult = await testGuideNPC();
  const thaliaResult = await testThaliaTraderNPC();
  
  // Report results
  console.log('\n====== TEST RESULTS ======');
  console.log('NPCs List Test:', npcListResult.success ? '✅ PASS' : '❌ FAIL');
  console.log('John Muir NPC Test:', johnMuirResult.success ? '✅ PASS' : '❌ FAIL');
  console.log('Guide NPC Test:', guideResult.success ? '✅ PASS' : '❌ FAIL');
  console.log('Thalia the Trader NPC Test:', thaliaResult.success ? '✅ PASS' : '❌ FAIL');
  
  // Overall result
  if (npcListResult.success && johnMuirResult.success && guideResult.success && thaliaResult.success) {
    console.log('\n✅ ALL NPC TESTS PASSED');
    return true;
  } else {
    console.log('\n❌ SOME NPC TESTS FAILED');
    return false;
  }
}

// Run the tests
runAllTests().then(result => {
  console.log(`\nTest run ${result ? 'successful' : 'failed'}`);
}); 