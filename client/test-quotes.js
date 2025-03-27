// Simple script to test all quote APIs
import axios from 'axios';

// Basic axios instance for tests
const api = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

async function testShakespeareAPI() {
  console.log('\nTesting Shakespeare API...');
  try {
    const response = await api.get('/api/external/shakespeare');
    console.log('SUCCESS:', response.data);
    return true;
  } catch (error) {
    console.error('ERROR:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return false;
  }
}

async function testQuoteAPI() {
  console.log('\nTesting Quote API...');
  try {
    const response = await api.get('/api/external/quote?author=shakespeare');
    console.log('SUCCESS:', response.data);
    return true;
  } catch (error) {
    console.error('ERROR:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return false;
  }
}

async function testZenAPI() {
  console.log('\nTesting Zen API...');
  try {
    const response = await api.get('/api/external/zen');
    console.log('SUCCESS:', response.data);
    return true;
  } catch (error) {
    console.error('ERROR:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return false;
  }
}

async function runTests() {
  console.log('====== STARTING QUOTE API TESTS ======');
  
  let shakespeareResult = await testShakespeareAPI();
  let quoteResult = await testQuoteAPI();
  let zenResult = await testZenAPI();
  
  console.log('\n====== TEST RESULTS ======');
  console.log('Shakespeare API:', shakespeareResult ? '✅ PASS' : '❌ FAIL');
  console.log('Quote API:', quoteResult ? '✅ PASS' : '❌ FAIL');
  console.log('Zen API:', zenResult ? '✅ PASS' : '❌ FAIL');
}

// Run the tests
runTests(); 