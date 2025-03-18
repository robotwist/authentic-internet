import { chat } from '../api/api';
import { NPC_TYPES } from '../components/Constants';

// Mock Shakespeare NPC config
const shakespeareNPC = {
  type: NPC_TYPES.SHAKESPEARE,
  name: 'William Shakespeare',
  role: 'Playwright and Poet',
  apiEndpoint: 'https://folgerdigitaltexts.org/api',
  context: 'You are William Shakespeare, the famous playwright and poet from the Elizabethan era.'
};

// Test prompts
const testPrompts = [
  "What do you think about love?",
  "Tell me about your most famous play",
  "What is your opinion on fate?",
  "How do you view human nature?",
  "What inspires your writing?"
];

// Run tests
async function testShakespeareResponses() {
  console.log('🎭 Testing Shakespeare NPC responses...');
  console.log('======================================');
  
  let successCount = 0;
  let errorCount = 0;
  const responses = [];
  
  for (const prompt of testPrompts) {
    try {
      console.log(`📝 Testing prompt: "${prompt}"`);
      const result = await chat(prompt, shakespeareNPC.context, shakespeareNPC.role, shakespeareNPC);
      
      if (Array.isArray(result.response)) {
        console.log(`✅ Received ${result.response.length} responses`);
        
        // Log the first response
        if (result.response.length > 0) {
          const firstResponse = result.response[0];
          console.log(`📜 First response: "${firstResponse.text.substring(0, 100)}..."`);
          console.log(`📚 Source: ${firstResponse.source}`);
          responses.push(firstResponse.text);
        }
      } else {
        console.log(`✅ Received response: "${result.response.substring(0, 100)}..."`);
        console.log(`📚 Source: ${result.source}`);
        responses.push(result.response);
      }
      
      successCount++;
    } catch (error) {
      console.error(`❌ Error with prompt "${prompt}":`, error.message);
      errorCount++;
    }
    
    console.log('--------------------------------------');
  }
  
  // Check for response uniqueness
  const uniqueResponses = new Set(responses);
  console.log(`\n📊 Test Results:`);
  console.log(`✅ Successful responses: ${successCount}/${testPrompts.length}`);
  console.log(`❌ Errors: ${errorCount}/${testPrompts.length}`);
  console.log(`🔄 Unique responses: ${uniqueResponses.size}/${responses.length}`);
  
  // Overall assessment
  if (errorCount === 0 && uniqueResponses.size === responses.length) {
    console.log('\n🎉 Shakespeare NPC is working perfectly! All responses are unique and no errors occurred.');
  } else if (errorCount === 0) {
    console.log('\n✅ Shakespeare NPC is working without errors, but some responses may be duplicated.');
  } else if (errorCount < testPrompts.length / 2) {
    console.log('\n⚠️ Shakespeare NPC is partially working but encountered some errors.');
  } else {
    console.log('\n❌ Shakespeare NPC is not working correctly. Most requests resulted in errors.');
  }
}

// Export the test function
export default testShakespeareResponses; 