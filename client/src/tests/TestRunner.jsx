import React, { useState, useEffect, useRef } from 'react';
import { testShakespeareResponses, testHistoricalNPCs, testAppFunctionality, runAllTests } from './run-tests';

const TestRunner = () => {
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTest, setSelectedTest] = useState('all');
  const logContainerRef = useRef(null);

  // Override console methods to capture logs
  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.log = (...args) => {
      originalConsoleLog(...args);
      setLogs(prev => [...prev, { type: 'log', content: args.join(' ') }]);
    };

    console.error = (...args) => {
      originalConsoleError(...args);
      setLogs(prev => [...prev, { type: 'error', content: args.join(' ') }]);
    };

    console.warn = (...args) => {
      originalConsoleWarn(...args);
      setLogs(prev => [...prev, { type: 'warn', content: args.join(' ') }]);
    };

    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const runTest = async () => {
    setLogs([]);
    setIsRunning(true);

    try {
      switch (selectedTest) {
        case 'shakespeare':
          await testShakespeareResponses();
          break;
        case 'historical':
          await testHistoricalNPCs();
          break;
        case 'app':
          await testAppFunctionality();
          break;
        case 'all':
        default:
          await runAllTests();
          break;
      }
    } catch (error) {
      console.error('Test execution error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '800px', 
      margin: '0 auto',
      fontFamily: 'var(--primary-font)'
    }}>
      <h1>Test Runner</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <select 
          value={selectedTest} 
          onChange={(e) => setSelectedTest(e.target.value)}
          style={{ 
            padding: '8px', 
            marginRight: '10px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        >
          <option value="all">All Tests</option>
          <option value="shakespeare">Shakespeare NPC</option>
          <option value="historical">All Historical NPCs</option>
          <option value="app">App Functionality</option>
        </select>
        
        <button 
          onClick={runTest} 
          disabled={isRunning}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: isRunning ? '#ccc' : '#4a90e2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isRunning ? 'not-allowed' : 'pointer'
          }}
        >
          {isRunning ? 'Running...' : 'Run Test'}
        </button>
        
        <button 
          onClick={clearLogs}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            marginLeft: '10px',
            cursor: 'pointer'
          }}
        >
          Clear Logs
        </button>
      </div>
      
      <div 
        ref={logContainerRef}
        style={{ 
          height: '500px', 
          overflowY: 'auto',
          backgroundColor: '#1e1e1e',
          color: '#fff',
          padding: '10px',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '14px',
          lineHeight: '1.5'
        }}
      >
        {logs.map((log, index) => (
          <div 
            key={index} 
            style={{ 
              color: log.type === 'error' ? '#f44336' : 
                     log.type === 'warn' ? '#ff9800' : '#fff',
              marginBottom: '5px'
            }}
          >
            {log.content}
          </div>
        ))}
        {isRunning && (
          <div style={{ color: '#4a90e2' }}>Running tests...</div>
        )}
      </div>
    </div>
  );
};

export default TestRunner; 