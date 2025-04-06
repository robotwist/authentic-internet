import React, { useEffect, useState, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AchievementProvider } from './context/AchievementContext';
import { useGameState } from './context/GameStateContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import World from './pages/World';
import Profile from './pages/Profile';
import CreateWorld from './pages/CreateWorld';
import GameWorld from './components/GameWorld';
import ArtifactsPage from './pages/ArtifactsPage';
import ErrorBoundary from './components/ErrorBoundary';
import TextAdventure from './components/TextAdventure';
import Level4Shooter from './components/Level4Shooter';
import LoadingScreen from './components/LoadingScreen';
import './App.css';

// Debug startup
console.log('App starting at', new Date().toISOString());

function App() {
  const [world, setWorld] = useState('desert1');
  const [user, setUser] = useState(null);
  const [startupTime] = useState(new Date().toISOString());
  const gameState = useGameState();

  // Debug mount
  useEffect(() => {
    console.log('App mounted at', new Date().toISOString(), 'startup was at', startupTime);
    return () => console.log('App unmounting at', new Date().toISOString());
  }, [startupTime]);

  const handleWorldChange = (worldId) => {
    // ... existing code ...
    
    // Add handling for Hemingway's Adventure and Text Adventure
    if (worldId === 'hemingway') {
      return <Level4Shooter onComplete={() => setWorld('desert1')} onExit={() => setWorld('desert1')} />;
    }
    
    if (worldId === 'text_adventure') {
      return <TextAdventure 
        username={user?.username || 'traveler'}
        onComplete={() => setWorld('dungeon3')} 
        onExit={() => setWorld('dungeon3')} 
      />;
    }
    
    // ... existing code ...
  };

  return (
    <div className="app">
      <AchievementProvider>
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
            <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
            <Route path="/register" element={<ErrorBoundary><Register /></ErrorBoundary>} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <ErrorBoundary><Dashboard /></ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/worlds/create"
              element={
                <ProtectedRoute>
                  <ErrorBoundary><CreateWorld /></ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/world/:id"
              element={
                <ProtectedRoute>
                  <ErrorBoundary><World /></ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ErrorBoundary><Profile /></ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/artifacts"
              element={
                <ProtectedRoute>
                  <ErrorBoundary><ArtifactsPage /></ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/artifacts/:id"
              element={
                <ProtectedRoute>
                  <ErrorBoundary><ArtifactsPage /></ErrorBoundary>
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
        </main>
      </AchievementProvider>
    </div>
  );
}

export default App;
