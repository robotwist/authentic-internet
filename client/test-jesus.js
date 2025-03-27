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

// Test the Jesus API endpoint directly
async function testJesusAPI() {
  console.log('\nTesting Jesus API Endpoint...');
  try {
    const response = await api.post('/api/npcs/jesus', {
      prompt: "Share a teaching about love"
    });
    
    console.log('SUCCESS: Jesus API returned a quote');
    console.log('Quote:', response.data.text || response.data.quote);
    console.log('Source:', response.data.source);
    
    return {
      success: true,
      quote: response.data.text || response.data.quote,
      source: response.data.source,
      context: response.data.context,
      author: response.data.author
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

// Test NPC interaction through the handleNPCInteraction function
async function testJesusInteraction() {
  console.log('\nTesting Jesus NPC Interaction...');
  try {
    const response = await api.post('/api/npcs/jesus', {
      npcId: 'jesus',
      message: "Share wisdom about forgiveness",
      userId: "test-user-123"
    });
    
    console.log('SUCCESS: NPC interaction succeeded');
    console.log('Response:', response.data);
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

// Test if Jesus appears in the NPC list
async function testJesusInNPCList() {
  console.log('\nChecking if Jesus is in the NPC list...');
  try {
    const response = await api.get('/api/npcs/list');
    
    const jesusNPC = response.data.find(npc => 
      npc.name === 'Jesus' || npc.type === 'jesus'
    );
    
    if (jesusNPC) {
      console.log('SUCCESS: Jesus NPC found in the list');
      console.log('NPC details:', jesusNPC);
      return { success: true, npc: jesusNPC };
    } else {
      console.log('WARNING: Jesus NPC not found in the NPC list');
      console.log('Available NPCs:', response.data.map(npc => npc.name).join(', '));
      return { success: false };
    }
  } catch (error) {
    console.error('ERROR:', error.message);
    return { success: false };
  }
}

// Run all tests
async function runAllTests() {
  console.log('====== STARTING JESUS NPC TESTS ======');
  
  // Run the tests
  const apiResult = await testJesusAPI();
  const interactionResult = await testJesusInteraction();
  const npcListResult = await testJesusInNPCList();
  
  // Report results
  console.log('\n====== TEST RESULTS ======');
  console.log('Jesus API Test:', apiResult.success ? '✅ PASS' : '❌ FAIL');
  console.log('Jesus Interaction Test:', interactionResult.success ? '✅ PASS' : '❌ FAIL');
  console.log('Jesus in NPC List:', npcListResult.success ? '✅ PASS' : '❌ FAIL');
  
  // Overall result
  if (apiResult.success && interactionResult.success && npcListResult.success) {
    console.log('\n✅ ALL JESUS NPC TESTS PASSED');
    return true;
  } else {
    console.log('\n❌ SOME JESUS NPC TESTS FAILED');
    return false;
  }
}

// Run the tests
runAllTests().then(result => {
  console.log(`\nTest run ${result ? 'successful' : 'failed'}`);
}); 