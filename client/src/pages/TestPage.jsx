import React, { useState } from 'react';
import { runAllTests, testHistoricalNPCs, testAppFunctionality, testArtifactUpdate } from '../tests/run-tests';
import './TestPage.css';

const TestPage = () => {
  const [testOutput, setTestOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  // Redirect console output to our UI
  const setupConsoleRedirect = () => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    
    console.log = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      setTestOutput(prev => [...prev, { type: 'log', message }]);
      originalConsoleLog(...args);
    };
    
    console.error = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      setTestOutput(prev => [...prev, { type: 'error', message }]);
      originalConsoleError(...args);
    };
    
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    };
  };

  // Run a specific test suite
  const runTest = async (testFn, name) => {
    setIsRunning(true);
    setTestOutput([{ type: 'log', message: `📋 Starting ${name} tests...` }]);
    
    const cleanup = setupConsoleRedirect();
    
    try {
      await testFn();
    } catch (err) {
      console.error('Test execution error:', err);
    } finally {
      cleanup();
      setIsRunning(false);
    }
  };

  return (
    <div className="test-page">
      <div className="test-header">
        <h1>🧪 Authentic Internet Test Suite</h1>
        <p>Run various tests to verify application functionality</p>
      </div>
      
      <div className="test-controls">
        <button 
          onClick={() => runTest(runAllTests, 'all')}
          disabled={isRunning}
          className="test-button all"
        >
          🧪 Run All Tests
        </button>
        
        <button 
          onClick={() => runTest(testHistoricalNPCs, 'NPC')}
          disabled={isRunning}
          className="test-button npc"
        >
          👤 Test NPCs
        </button>
        
        <button 
          onClick={() => runTest(testAppFunctionality, 'application')}
          disabled={isRunning}
          className="test-button app"
        >
          🖥️ Test App Functions
        </button>
        
        <button 
          onClick={() => runTest(testArtifactUpdate, 'artifact update')}
          disabled={isRunning}
          className="test-button artifact"
        >
          📦 Test Artifact Updates
        </button>
      </div>
      
      <div className="test-output">
        <div className="output-header">
          <h2>Test Output</h2>
          <button 
            onClick={() => setTestOutput([])}
            disabled={isRunning || testOutput.length === 0}
            className="clear-button"
          >
            Clear Output
          </button>
        </div>
        
        <div className="output-console">
          {testOutput.length === 0 ? (
            <div className="empty-output">Run a test to see output here</div>
          ) : (
            testOutput.map((entry, index) => (
              <div key={index} className={`output-line ${entry.type}`}>
                {entry.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TestPage; 