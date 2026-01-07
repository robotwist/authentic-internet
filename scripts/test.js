#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function runTests() {
  const startTime = Date.now();
  const results = {
    unit: { passed: false, duration: 0 },
    integration: { passed: false, duration: 0 },
    e2e: { passed: false, duration: 0 }
  };

  log('\n🚀 Starting Comprehensive Test Suite', 'bright');
  log('=====================================\n', 'bright');

  // Check if server is running
  log('📡 Checking server status...', 'blue');
  try {
    const response = await fetch('http://localhost:5000/api/health');
    if (response.ok) {
      log('✅ Server is running', 'green');
    } else {
      log('⚠️ Server responded but not healthy', 'yellow');
    }
  } catch (error) {
    log('❌ Server is not running. Please start the server first.', 'red');
    log('   Run: npm run dev', 'cyan');
    process.exit(1);
  }

  // Run Unit Tests
  log('\n🧪 Running Unit Tests...', 'blue');
  const unitStart = Date.now();
  try {
    await runCommand('npm', ['test', '--', '--testPathPattern=unit', '--coverage']);
    results.unit.passed = true;
    results.unit.duration = Date.now() - unitStart;
    log('✅ Unit tests passed', 'green');
  } catch (error) {
    results.unit.duration = Date.now() - unitStart;
    log('❌ Unit tests failed', 'red');
  }

  // Run Integration Tests
  log('\n🔗 Running Integration Tests...', 'blue');
  const integrationStart = Date.now();
  try {
    await runCommand('npm', ['test', '--', '--testPathPattern=integration']);
    results.integration.passed = true;
    results.integration.duration = Date.now() - integrationStart;
    log('✅ Integration tests passed', 'green');
  } catch (error) {
    results.integration.duration = Date.now() - integrationStart;
    log('❌ Integration tests failed', 'red');
  }

  // Run E2E Tests
  log('\n🌐 Running End-to-End Tests...', 'blue');
  const e2eStart = Date.now();
  try {
    await runCommand('npx', ['playwright', 'test']);
    results.e2e.passed = true;
    results.e2e.duration = Date.now() - e2eStart;
    log('✅ E2E tests passed', 'green');
  } catch (error) {
    results.e2e.duration = Date.now() - e2eStart;
    log('❌ E2E tests failed', 'red');
  }

  // Generate Test Report
  const totalDuration = Date.now() - startTime;
  const passedTests = Object.values(results).filter(r => r.passed).length;
  const totalTests = Object.keys(results).length;

  log('\n📊 Test Results Summary', 'bright');
  log('======================', 'bright');
  
  Object.entries(results).forEach(([testType, result]) => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    const color = result.passed ? 'green' : 'red';
    log(`${testType.toUpperCase()}: ${status} (${result.duration}ms)`, color);
  });

  log(`\nTotal Duration: ${totalDuration}ms`, 'cyan');
  log(`Success Rate: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`, 'cyan');

  if (passedTests === totalTests) {
    log('\n🎉 All tests passed! The game is working perfectly!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️ Some tests failed. Please check the output above.', 'yellow');
    process.exit(1);
  }
}

// Handle script arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  log('Usage: node scripts/test.js [options]', 'bright');
  log('Options:', 'bright');
  log('  --unit-only     Run only unit tests', 'cyan');
  log('  --integration-only  Run only integration tests', 'cyan');
  log('  --e2e-only      Run only E2E tests', 'cyan');
  log('  --help, -h      Show this help message', 'cyan');
  process.exit(0);
}

runTests().catch(error => {
  log(`\n💥 Test runner failed: ${error.message}`, 'red');
  process.exit(1);
}); 