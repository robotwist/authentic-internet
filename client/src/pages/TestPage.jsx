import React from 'react';
import TestRunner from '../tests/TestRunner';

const TestPage = () => {
  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <TestRunner />
    </div>
  );
};

export default TestPage; 