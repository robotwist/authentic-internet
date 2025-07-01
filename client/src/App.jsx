import React from 'react';
import { GlobalProviders } from './components/providers/GlobalProviders';
import { AppLayout } from './components/layout/AppLayout';
import { AppRouter } from './components/routing/AppRouter';
import './App.css';

/**
 * App - Clean main application component
 * 
 * Following Single Responsibility Principle, this component only
 * orchestrates the high-level application structure by composing
 * focused components that handle specific concerns.
 */
function App() {
  return (
    <GlobalProviders>
      <AppLayout>
        <AppRouter />
      </AppLayout>
    </GlobalProviders>
  );
}

export default App;
