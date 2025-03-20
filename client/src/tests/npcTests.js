import { chat } from '../api/api';
import { NPC_TYPES } from '../components/Constants';

/**
 * Test historical NPC responses
 * This test verifies that historical NPCs respond correctly to prompts
 */
export const testHistoricalNPCs = async () => {
  console.log('🧪 Running tests for historical NPCs...');
  console.log('======================================');
  
  // Define historical NPCs to test
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
  
  // Test each NPC
  for (const npc of historicalNPCs) {
    console.log(`\n🧪 Testing ${npc.name} NPC responses...`);
    console.log('======================================');
    
    try {
      // Try to get a response from the NPC
      const result = await chat("Tell me about yourself", npc.context, npc.role, npc);
      console.log(`✅ ${npc.name} responded successfully`);
      
      // Log the response
      if (result.response) {
        if (typeof result.response === 'string') {
          console.log(`📜 Response: "${result.response.substring(0, 100)}..."`);
        } else if (Array.isArray(result.response)) {
          console.log(`📜 First response: "${result.response[0].text.substring(0, 100)}..."`);
        }
      }
      
      // Log the source
      if (result.source) {
        console.log(`📚 Source: ${result.source}`);
      }
    } catch (error) {
      console.error(`❌ Error testing ${npc.name}:`, error.message);
    }
  }
}; 