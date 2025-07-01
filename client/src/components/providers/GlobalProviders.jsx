import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AchievementProvider } from '../../context/AchievementContext';
import { AuthProvider } from '../../context/AuthContext';
import { GameStateProvider } from '../../context/GameStateContext';
import ErrorBoundary from '../ErrorBoundary';

/**
 * GlobalProviders - Centralizes all context providers
 * 
 * This component wraps the entire app with necessary context providers,
 * following the provider pattern for clean separation of concerns.
 */
export const GlobalProviders = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GameStateProvider>
          <AchievementProvider>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </AchievementProvider>
        </GameStateProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default GlobalProviders;