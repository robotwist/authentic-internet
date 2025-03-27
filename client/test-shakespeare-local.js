/**
 * Shakespeare API Test Script (Direct Method)
 * 
 * This script tests the Shakespeare quote functionality by directly using
 * the functions from our client's API module.
 * 
 * Run with: node test-shakespeare-local.js
 */

// Import the necessary axios library
import axios from 'axios';

// Create an axios instance configured for testing
const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000
});

// Helper to log the result nicely
const logResult = (label, result) => {
  console.log(`\n===== ${label} =====`);
  if (result.success) {
    console.log('✅ SUCCESS:');
    console.log(`Quote: "${result.data.text}"`);
    console.log(`Source: ${result.data.source}`);
    console.log(`Work: ${result.data.work}`);
    if (result.data.character) {
      console.log(`Character: ${result.data.character}`);
    }
    if (result.data.additionalQuotes && result.data.additionalQuotes.length > 0) {
      console.log(`Additional Quotes: ${result.data.additionalQuotes.length}`);
    }
  } else {
    console.log('❌ ERROR:');
    console.log(result.error);
  }
};

// Test the external Shakespeare endpoint
const testExternalShakespeareEndpoint = async () => {
  console.log('\nTesting External Shakespeare API...');
  try {
    const response = await api.get('/api/external/shakespeare?prompt=Give me a quote about life');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response ? 
        `${error.response.status}: ${JSON.stringify(error.response.data)}` : 
        error.message
    };
  }
};

// Test with a specific play reference
const testSpecificPlay = async () => {
  console.log('\nTesting Shakespeare API with specific play reference...');
  try {
    const response = await api.get('/api/external/shakespeare?prompt=Give me a quote from Hamlet about mortality');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response ? 
        `${error.response.status}: ${JSON.stringify(error.response.data)}` : 
        error.message
    };
  }
};

// Test the Quotable API directly through our external route
const testQuotableAPI = async () => {
  console.log('\nTesting Quotable API via our external route...');
  try {
    const response = await api.get('/api/external/quote?author=shakespeare');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response ? 
        `${error.response.status}: ${JSON.stringify(error.response.data)}` : 
        error.message
    };
  }
};

// Run all the tests
const runAllTests = async () => {
  try {
    // Test 1: External Shakespeare API
    const result1 = await testExternalShakespeareEndpoint();
    logResult('External Shakespeare API Test', result1);

    // Test 2: Shakespeare API with specific play
    const result2 = await testSpecificPlay();
    logResult('Shakespeare API with Specific Play Test', result2);

    // Test 3: Quotable API
    const result3 = await testQuotableAPI();
    logResult('Quotable API Test', result3);

    console.log('\nAll tests completed!');
  } catch (error) {
    console.error('Error running tests:', error);
  }
};

// Run the tests
runAllTests(); 