/**
 * Shakespeare Quote API Test Script
 * 
 * This script tests the various Shakespeare API endpoints to verify they're working correctly.
 * It makes direct calls to both our local API and the external APIs we're using.
 * 
 * Run with: node test-shakespeare.js
 */

import fetch from 'node-fetch';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ESM compatibility for __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const LOCAL_API_URL = 'http://localhost:5000';

// Helper functions
const logResult = (apiName, data, error = null) => {
  console.log('\n' + '-'.repeat(80));
  console.log(`📖 ${apiName} TEST RESULT`);
  console.log('-'.repeat(80));
  
  if (error) {
    console.error('❌ ERROR:', error.message || error);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return;
  }
  
  console.log('✅ SUCCESS');
  console.log('Data:', JSON.stringify(data, null, 2));
};

// Test functions
async function testLocalShakespeareAPI() {
  try {
    console.log('Testing local Shakespeare API...');
    const response = await fetch(`${LOCAL_API_URL}/api/npcs/shakespeare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt: 'Share a quote about life' })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    logResult('LOCAL SHAKESPEARE API', data);
    return data;
  } catch (error) {
    logResult('LOCAL SHAKESPEARE API', null, error);
    return null;
  }
}

async function testLocalPlayRefAPI() {
  try {
    console.log('Testing local Shakespeare API with play reference...');
    const response = await fetch(`${LOCAL_API_URL}/api/npcs/shakespeare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt: 'Share a quote from Hamlet about mortality' })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    logResult('LOCAL SHAKESPEARE API WITH PLAY REFERENCE', data);
    return data;
  } catch (error) {
    logResult('LOCAL SHAKESPEARE API WITH PLAY REFERENCE', null, error);
    return null;
  }
}

async function testQuotableAPI() {
  try {
    console.log('Testing Quotable.io API with Shakespeare tag...');
    const agent = new axios.create({
      httpsAgent: new (await import('https')).Agent({  
        rejectUnauthorized: false
      })
    });
    
    const response = await agent.get('https://api.quotable.io/quotes', {
      params: {
        tags: 'shakespeare',
        limit: 5
      },
      timeout: 8000
    });
    
    logResult('QUOTABLE API (SHAKESPEARE TAG)', response.data);
    return response.data;
  } catch (error) {
    logResult('QUOTABLE API (SHAKESPEARE TAG)', null, error);
    return null;
  }
}

// Run tests
async function runTests() {
  console.log('🧪 TESTING SHAKESPEARE QUOTE APIS...');
  
  // Test our local API endpoint (no auth required now)
  await testLocalShakespeareAPI();
  
  // Test our local API with a specific play reference
  await testLocalPlayRefAPI();
  
  // Test Quotable API directly with certificate validation disabled
  await testQuotableAPI();
  
  console.log('\n🔍 TESTS COMPLETED');
}

runTests().catch(console.error); 