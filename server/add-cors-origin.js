// Helper script to add new CORS origins to the server configuration
// Usage: CORS_ADD_ORIGIN=http://localhost:3000 node add-cors-origin.js

import { addOriginToAllowedOrigins } from './middleware/cors-updater.js';

async function main() {
  const origin = process.env.CORS_ADD_ORIGIN;
  
  if (!origin) {
    console.error('Error: No origin specified');
    console.error('Usage: CORS_ADD_ORIGIN=http://example.com node add-cors-origin.js');
    process.exit(1);
  }
  
  console.log(`Adding origin ${origin} to allowed CORS origins...`);
  
  const result = await addOriginToAllowedOrigins(origin);
  
  if (result.success) {
    console.log('\x1b[32m%s\x1b[0m', '✅ ' + result.message);
    console.log('Restart the server to apply the changes.');
  } else {
    console.error('\x1b[31m%s\x1b[0m', '❌ ' + result.message);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
}); 