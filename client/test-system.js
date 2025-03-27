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

// Test server connection
async function testServerConnection() {
  console.log('\nTesting Server Connection...');
  try {
    const response = await api.get('/health');
    console.log('SUCCESS: Server is online');
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.error('ERROR:', error.message);
    return false;
  }
}

// Check if all required NPC assets exist
async function testNPCAssets() {
  console.log('\nTesting NPC Asset Availability...');
  const npcImages = [
    '/assets/npcs/shakespeare.png',
    '/assets/npcs/zeus.png',
    '/assets/npcs/jesus.png' // This will fail if it doesn't exist
  ];
  
  let allAssetsExist = true;
  
  for (const imagePath of npcImages) {
    try {
      const response = await fetch(`http://localhost:5173${imagePath}`, {
        method: 'HEAD'
      });
      
      if (response.ok) {
        console.log(`✅ NPC asset exists: ${imagePath}`);
      } else {
        console.error(`❌ NPC asset missing: ${imagePath}`);
        allAssetsExist = false;
      }
    } catch (error) {
      console.error(`❌ Error checking NPC asset ${imagePath}:`, error.message);
      allAssetsExist = false;
    }
  }
  
  return allAssetsExist;
}

// Test font availability
async function testFontAvailability() {
  console.log('\nTesting Font Availability...');
  try {
    // Check Chicago font file existence
    const chicagoFontPath = '/assets/fonts/ChicagoFLF.ttf';
    const response = await fetch(`http://localhost:5173${chicagoFontPath}`, {
      method: 'HEAD'
    });
    
    if (response.ok) {
      console.log(`✅ Chicago font exists at ${chicagoFontPath}`);
      return true;
    } else {
      console.error(`❌ Chicago font missing at ${chicagoFontPath}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking font availability:', error.message);
    return false;
  }
}

// Test API endpoints
async function testAPIEndpoints() {
  console.log('\nTesting API Endpoints...');
  
  const endpoints = [
    { name: 'Health Check', path: '/health' },
    { name: 'Authentication', path: '/api/auth/status' },
    { name: 'Artifacts', path: '/api/artifacts?testMode=true' },
    { name: 'NPCs', path: '/api/npcs/list' },
    { name: 'Shakespeare API', path: '/api/external/shakespeare' },
    { name: 'Quote API', path: '/api/external/quote' },
    { name: 'Zen API', path: '/api/external/zen' }
  ];
  
  let allEndpointsWorking = true;
  
  for (const endpoint of endpoints) {
    try {
      const response = await api.get(endpoint.path);
      console.log(`✅ ${endpoint.name} endpoint working`);
    } catch (error) {
      console.error(`❌ ${endpoint.name} endpoint failed:`, error.message);
      allEndpointsWorking = false;
    }
  }
  
  return allEndpointsWorking;
}

// Run all tests
async function runAllTests() {
  console.log('====== STARTING SYSTEM TESTS ======');
  
  // First check server connection
  const serverConnected = await testServerConnection();
  if (!serverConnected) {
    console.error('\n❌ Cannot proceed with tests - Server not available');
    return;
  }
  
  // Run all tests
  const npcAssetsResult = await testNPCAssets();
  const fontResult = await testFontAvailability();
  const apiEndpointsResult = await testAPIEndpoints();
  
  // Report results
  console.log('\n====== TEST RESULTS ======');
  console.log('Server Connection:', serverConnected ? '✅ PASS' : '❌ FAIL');
  console.log('NPC Assets:', npcAssetsResult ? '✅ PASS' : '❌ FAIL');
  console.log('Font Availability:', fontResult ? '✅ PASS' : '❌ FAIL');
  console.log('API Endpoints:', apiEndpointsResult ? '✅ PASS' : '❌ FAIL');
  
  // Overall result
  if (serverConnected && npcAssetsResult && fontResult && apiEndpointsResult) {
    console.log('\n✅ ALL SYSTEM TESTS PASSED');
  } else {
    console.log('\n❌ SOME SYSTEM TESTS FAILED');
  }
}

// Run all tests
runAllTests(); 