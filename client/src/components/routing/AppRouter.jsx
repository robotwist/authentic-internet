import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import ErrorBoundary from '../ErrorBoundary';
import LoadingScreen from '../LoadingScreen';

// Page imports
import Home from '../../pages/Home';
import Login from '../../pages/Login';
import Register from '../../pages/Register';
import Dashboard from '../../pages/Dashboard';
import World from '../../pages/World';
import Profile from '../../pages/Profile';
import CreateWorld from '../../pages/CreateWorld';
import GameWorld from '../GameWorld';
import ArtifactsPage from '../../pages/ArtifactsPage';

/**
 * AppRouter - Centralized routing configuration
 * 
 * Separates routing logic from the main App component for better maintainability.
 * Each route is wrapped with appropriate error boundaries and protection.
 */
export const AppRouter = () => {
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <ErrorBoundary>
            <Home />
          </ErrorBoundary>
        } 
      />
      
      <Route 
        path="/login" 
        element={
          <ErrorBoundary>
            <Login />
          </ErrorBoundary>
        } 
      />
      
      <Route 
        path="/register" 
        element={
          <ErrorBoundary>
            <Register />
          </ErrorBoundary>
        } 
      />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <Dashboard />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/worlds/create"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <CreateWorld />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/world/:id"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <World />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <Profile />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/artifacts"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <ArtifactsPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/artifacts/:id"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <ArtifactsPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/game/:worldId?/:areaId?"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <ErrorBoundary>
              <GameWorld />
            </ErrorBoundary>
          </Suspense>
        }
      />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRouter;