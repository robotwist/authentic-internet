import React, { useEffect, useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
import LoadingScreen from './components/LoadingScreen';
import './App.css';

function App() {
  const [world, setWorld] = useState('desert1');
  const [user, setUser] = useState(null);

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
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="app">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/worlds/create"
                  element={
                    <ProtectedRoute>
                      <CreateWorld />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/world/:id"
                  element={
                    <ProtectedRoute>
                      <World />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/artifacts"
                  element={
                    <ProtectedRoute>
                      <ArtifactsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/artifacts/:id"
                  element={
                    <ProtectedRoute>
                      <ArtifactsPage />
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
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
